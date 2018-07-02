from django.conf import settings
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.staticfiles.templatetags.staticfiles import static
from django.http import Http404, HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from django.views.decorators.clickjacking import xframe_options_exempt
from django.views.generic import View

from hsreplaynet.games.models import GameReplay
from hsreplaynet.uploads.models import UploadEvent

from . import SimpleReactView


class MyReplaysView(LoginRequiredMixin, SimpleReactView):
	title = _("My Replays")
	bundle = "my_replays"

	def get_react_context(self):
		return {
			"total_games": GameReplay.objects.live().filter(
				user=self.request.user
			).count()
		}


class ReplayDetailView(View):
	template_name = "games/replay_detail.html"
	model = GameReplay
	bundle = "replay_detail"

	def get_object(self, id):
		replay = self.model.objects.find_by_short_id(id)
		if not replay:
			raise Http404("Replay not found.")

		return replay

	def get(self, request, id):
		replay = self.replay = self.get_object(id)
		if replay.is_deleted:
			return render(self.request, self.template_name, {"replay": None}, status=410)
		replay.views += 1
		replay.save()

		request.head.set_canonical_url(replay.get_absolute_url())
		description = replay.generate_description()

		twitter_card = request.GET.get("twitter_card", "summary")
		if twitter_card not in ("summary", "player"):
			twitter_card = "summary"

		request.head.title = replay.pretty_name_spoilerfree
		request.head.add_meta(
			{"name": "description", "content": description},
			{"name": "date", "content": replay.global_game.match_start.isoformat()},
			{"property": "og:description", "content": description},
			{"name": "twitter:card", "content": twitter_card},
		)

		request.head.add_stylesheets(
			settings.JOUST_STATIC_URL + "joust.css",
			"fonts/belwefs_extrabold_macroman/stylesheet.css",
			"fonts/franklingothicfs_mediumcondensed_macroman/stylesheet.css",
		)

		if twitter_card == "player":
			thumbnail = request.build_absolute_uri(static("images/joust-thumbnail.png"))
			embed_url = reverse("games_replay_embed", kwargs={"id": replay.shortid})
			request.head.add_meta(
				{"name": "twitter:player", "content": request.build_absolute_uri(embed_url)},
				{"name": "twitter:player:width", "content": 640},
				{"name": "twitter:player:height", "content": 360},
				{"name": "twitter:image", "content": thumbnail},
			)

		context = {
			"replay": replay,
			"players": replay.global_game.players.all(),
			"react_context": self.get_react_context(),
		}
		return render(request, self.template_name, context)

	def get_react_context(self):
		if not self.replay:
			return {"deleted": True}
		autoplay = self.request.user.is_authenticated and self.request.user.joust_autoplay
		ret = {
			"autoplay": autoplay,
			"annotated_replay_url": reverse(
				"annotated_replay", kwargs={"shortid": self.replay.shortid}
			),
			"build": self.replay.global_game.build,
			"can_update": self.request.user == self.replay.user,
			"format_name": self.replay.global_game.format_friendly_name,  # XXX
			"match_start": self.replay.global_game.match_start,
			"ladder_season": self.replay.global_game.ladder_season,
			"opponent_name": self.replay.opposing_player.name,
			"own_turns": self.replay.global_game.num_own_turns,
			"player_name": self.replay.friendly_player.name,
			"replay_url": self.replay.replay_xml.url,
			"shortid": self.replay.shortid,
			"views": self.replay.views,
			"visibility": self.replay.visibility.value,
		}
		if self.request.user.is_staff:
			ret["admin_url"] = reverse(
				"admin:games_gamereplay_change",
				args=[self.replay.id]
			)
		return ret


class ReplayEmbedView(View):
	template_name = "games/replay_embed.html"

	@xframe_options_exempt
	def get(self, request, id):
		replay = GameReplay.objects.find_by_short_id(id)
		if not replay:
			raise Http404("Replay not found.")
		if replay.is_deleted:
			return render(request, self.template_name, {"replay": None}, status=410)
		return render(request, self.template_name, {"replay": replay})


class AnnotatedReplayView(View):
	def get(self, request, shortid):
		from hsreplay.utils import annotate_replay
		from io import BytesIO

		replay = GameReplay.objects.find_by_short_id(shortid)
		if not replay or replay.is_deleted:
			raise Http404("Replay not found.")

		replay_xml = replay.replay_xml.open()
		annotated_replay = BytesIO()
		annotate_replay(replay_xml, annotated_replay)

		response = HttpResponse(annotated_replay.getvalue())
		response["Content-Type"] = "application/xml"
		return response


class UploadDetailView(SimpleReactView):
	bundle = "upload_processing"
	title = _("Uploading replay…")

	def get(self, request, **kwargs):
		shortid = kwargs["shortid"]
		replay = GameReplay.objects.find_by_short_id(shortid)
		if replay:
			return HttpResponseRedirect(replay.get_absolute_url())
		try:
			self.upload = UploadEvent.objects.get(shortid=shortid)
			if self.upload.game:
				return HttpResponseRedirect(self.upload.game.get_absolute_url())
		except UploadEvent.DoesNotExist:
			self.upload = None

		return super().get(request, **kwargs)

	def get_react_context(self):
		if not self.upload:
			return {}

		context = {
			"status": "PROCESSING" if self.upload.is_processing else self.upload.status.name,
			"error": self.upload.error,
		}

		if self.request.user.is_staff:
			context["admin_url"] = reverse(
				"admin:uploads_uploadevent_change", args=(self.upload.id,),
			)

		return context
