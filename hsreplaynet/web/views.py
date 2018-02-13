import json

from django.conf import settings
from django.views.generic import TemplateView
from hearthstone.enums import BnetGameType, CardClass

from ..analytics.views import fetch_query_results
from ..games.models import GameReplay
from .html import RequestMetaMixin


SITE_DESCRIPTION = "Watch and share Hearthstone replays directly from your web browser. \
Explore advanced statistics about decks and cards based on millions of games per week."

CARD_IMAGE_URL = "https://art.hearthstonejson.com/v1/256x/%s.jpg"

HERO_IDS = {
	CardClass.DRUID: "HERO_06",
	CardClass.HUNTER: "HERO_05a",
	CardClass.MAGE: "HERO_08a",
	CardClass.PALADIN: "HERO_04a",
	CardClass.PRIEST: "HERO_09a",
	CardClass.ROGUE: "HERO_03a",
	CardClass.SHAMAN: "HERO_02a",
	CardClass.WARLOCK: "HERO_07a",
	CardClass.WARRIOR: "HERO_01a",
}


class HomeView(TemplateView):
	template_name = "home.html"

	def get_context_data(self, **kwargs):
		context = super().get_context_data(**kwargs)
		context["featured_replay"] = self.get_featured_replay()
		winrate_data = self.get_winrate_data()

		context["player_classes"] = []
		for card_class in CardClass:
			if not card_class.is_playable or card_class not in winrate_data:
				continue
			data = winrate_data[card_class]
			context["player_classes"].append({
				"standard_url": "/decks/#playerClasses=" + card_class.name,
				"wild_url": "/decks/#playerClasses=%s&gameType=%s" % (card_class.name, "RANKED_WILD"),
				"arena_url": "/cards/#playerClass=%s&gameType=%s" % (card_class.name, "ARENA"),
				"image_url": CARD_IMAGE_URL % HERO_IDS[card_class],
				"name": card_class.name.title(),
				"standard_winrate": data["standard"] if "standard" in data else 50,
				"wild_winrate": data["wild"] if "wild" in data else 50,
				"arena_winrate": data["arena"] if "arena" in data else 50,
			})

		return context

	def get_winrate_data(self):
		try:
			query_result = fetch_query_results(
				self.request, "player_class_performance_summary"
			)
			data = json.loads(query_result.content.decode("utf8"))["series"]["data"]
		except Exception:
			return {}

		ret = {}
		for c, values in data.items():
			class_key = CardClass[c]
			ret[class_key] = {"standard": 50, "wild": 50}
			for value in values:
				if value["game_type"] == BnetGameType.BGT_RANKED_STANDARD:
					winrate_key = "standard"
				elif value["game_type"] == BnetGameType.BGT_RANKED_WILD:
					winrate_key = "wild"
				elif value["game_type"] == BnetGameType.BGT_ARENA:
					winrate_key = "arena"
				ret[class_key][winrate_key] = value["win_rate"]

		return ret

	def get_featured_replay(self):
		id = getattr(settings, "FEATURED_GAME_ID", None)
		if not id:
			return

		try:
			game = GameReplay.objects.get(shortid=id)
		except GameReplay.DoesNotExist:
			game = None

		return game

	def get(self, request):
		request.head.base_title = ""
		request.head.title = "HSReplay.net - Hearthstone Statistics and Replays"
		request.head.add_meta(
			{"name": "description", "content": SITE_DESCRIPTION},
			{"property": "og:description", "content": SITE_DESCRIPTION},
			{"name": "twitter:card", "content": "summary"},
		)
		return super().get(request)


class DownloadsView(RequestMetaMixin, TemplateView):
	template_name = "downloads.html"
	title = "Downloads"
	stylesheets = (
		{"href": settings.FONTAWESOME_CSS_URL, "integrity": settings.FONTAWESOME_CSS_INTEGRITY},
	)
