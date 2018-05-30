import json

from django.conf import settings
from django.http import Http404, JsonResponse
from django.shortcuts import get_object_or_404, render
from django.utils import translation
from django.utils.decorators import method_decorator
from django.views.generic import DetailView, TemplateView, View
from django_hearthstone.cards.models import Card
from hearthstone.enums import CardClass, CardSet, CardType, FormatType, Locale, Rarity

from hsreplaynet.features.decorators import view_requires_feature_access
from hsreplaynet.web.html import RequestMetaMixin
from hsreplaynet.web.templatetags.web_extras import lang_to_blizzard
from hsreplaynet.web.views import SimpleReactView

from .models import Archetype, ClusterSnapshot, Deck


##
# Meta overview pages

class MetaOverviewView(SimpleReactView):
	title = "Hearthstone Meta"
	description = (
		"Explore the Hearthstone meta game and find out "
		"how the archetypes match up."
	)
	bundle = "meta_overview"
	bundles = ("stats", "meta_overview")


##
# Discover pages

class DiscoverView(RequestMetaMixin, TemplateView):
	template_name = "decks/discover.html"
	title = "Discover"
	description = (
		"Engage with the up-and-coming Hearthstone meta game "
		"to discover the newest archetypes and what's next."
	)

	def get_context_data(self, **kwargs):
		context = super().get_context_data(**kwargs)
		context["hide_footer"] = True
		return context


##
# Archetype pages

class ArchetypeDetailView(RequestMetaMixin, View):
	template_name = "archetypes/archetype_detail.html"
	title = "Archetype"

	def get(self, request, id, slug):
		archetype = get_object_or_404(Archetype, id=id)
		if archetype.deleted:
			raise Http404("Archetype was deleted")

		request.head.title = archetype.name
		request.head.set_canonical_url(archetype.get_absolute_url())

		context = {
			"archetype": archetype,
			"has_standard_data": archetype.standard_signature is not None,
			"has_wild_data": archetype.wild_signature is not None,
		}

		return render(request, self.template_name, context)


##
# Card pages

class CardsView(RequestMetaMixin, TemplateView):
	template_name = "cards/cards.html"
	title = "Hearthstone Card Statistics"
	description = (
		"Compare statistics about all collectible Hearthstone cards. "
		"Find the cards that are played the most or have the highest winrate."
	)


class MyCardsView(RequestMetaMixin, TemplateView):
	template_name = "cards/my_cards.html"
	title = "My Cards"


@method_decorator(view_requires_feature_access("cardeditor"), name="dispatch")
class CardEditorView(RequestMetaMixin, TemplateView):
	template_name = "cards/card_editor.html"
	title = "Hearthstone Card Editor"
	scripts = (
		settings.SUNWELL_SCRIPT_URL,
	)
	stylesheets = (
		"fonts/belwefs_extrabold_macroman/stylesheet.css",
		"fonts/franklingothicfs_mediumcondensed_macroman/stylesheet.css",
	)


class CardDetailView(DetailView):
	model = Card

	@staticmethod
	def get_card_snippet(card):
		card_class = card.card_class.name.title()
		cost = "{amount} mana".format(amount=card.cost)
		cardtype = card.type.name.title()
		if card.rarity >= Rarity.RARE:
			rarity = card.rarity.name.title()
		else:
			rarity = ""

		if card.type == CardType.HERO:
			if card.card_set == CardSet.HERO_SKINS:
				components = [card_class, "Hero Skin"]
			elif card.cost == 0:
				if not card.collectible:
					card_class = "Adventure"
				components = [card_class, cardtype]
			else:
				components = [cost, rarity, card_class, cardtype]
		elif card.type == CardType.HERO_POWER:
			cardtype = "Hero Power"
			if card.cost == 0 and "Passive Hero Power" in card.description:
				cost = "Passive"
			components = [cost, card_class, cardtype]
		elif card.type == CardType.MINION:
			# if card.hide_stats: stats = "" ...
			stats = "{atk}/{health}".format(atk=card.atk, health=card.health)
			components = [cost, stats, rarity, card_class, cardtype]
		elif card.type == CardType.WEAPON:
			stats = "{atk}/{health}".format(atk=card.atk, health=card.durability)
			components = [cost, stats, rarity, card_class, cardtype]
		elif card.type == CardType.ENCHANTMENT:
			components = [card_class, cardtype]
		else:
			components = [cost, rarity, card_class, cardtype]

		return " ".join(c for c in components if c)

	def get_object(self, queryset=None):
		if queryset is None:
			queryset = self.get_queryset()

		pk = self.kwargs[self.pk_url_kwarg]
		if pk.isdigit():
			# If it's numeric, filter using the dbf id
			queryset = queryset.filter(dbf_id=pk)
		else:
			# Otherwise, use the card id
			queryset = queryset.filter(card_id=pk)

		try:
			obj = queryset.get()
		except queryset.model.DoesNotExist:
			raise Http404("No card found matching the query.")

		locale = Locale[lang_to_blizzard(translation.get_language())]
		name = obj.localized_name(locale=locale)

		self.request.head.set_canonical_url(obj.get_absolute_url() + "/")
		self.request.head.title = f"{name} - Hearthstone Card Statistics"
		self.request.head.opengraph["og:image"] = obj.get_card_art_url()
		self.request.head.opengraph["og:image:width"] = 256
		self.request.head.opengraph["og:image:height"] = 256

		card_desc = self.get_card_snippet(obj)
		description = f"{name} - {card_desc} - Statistics and decks!"
		self.request.head.add_meta(
			{"name": "description", "content": description},
			{"property": "og:description", "content": description},
		)

		return obj


##
# Deck pages

class DeckDetailView(View):
	template_name = "decks/deck_detail.html"

	def get(self, request, id):
		try:
			deck = Deck.objects.get_by_shortid(id)
		except Deck.DoesNotExist:
			raise Http404("Deck does not exist.")

		cards = deck.card_dbf_id_list()
		if len(cards) != 30:
			raise Http404("Deck list is too small.")

		deck_name = str(deck)
		request.head.title = deck_name

		if deck.deck_class:
			request.head.add_meta(
				{"property": "x-hearthstone:deck", "content": deck_name},
				{"property": "x-hearthstone:deck:deckstring", "content": deck.deckstring},
			)

		self.request.head.add_meta({
			"name": "description",
			"content": (
				"{name} stats and decklist. Import it: {deckstring}"
			).format(name=deck_name, deckstring=deck.deckstring),
		})

		context = {
			"deck": deck,
			"deck_name": deck_name,
			"deck_is_wild": 1 if deck.format == FormatType.FT_WILD else 0,
			"card_list": ",".join(str(id) for id in cards),
		}
		return render(request, self.template_name, context)


class DecksView(RequestMetaMixin, TemplateView):
	template_name = "decks/decks.html"
	title = "Hearthstone Decks"
	description = "Dive into the Hearthstone meta and find new decks by class, cards or " \
		"game mode. Learn about their winrates and popularity on the ladder."


class MyDecksView(RequestMetaMixin, TemplateView):
	template_name = "decks/my_decks.html"
	title = "My Decks"


class TrendingDecksView(RequestMetaMixin, TemplateView):
	template_name = "decks/trending.html"
	title = "Trending Hearthstone Decks"
	description = (
		"Find the up-and-coming decks with rising popularity in Hearthstone "
		"for each class updated every single day."
	)


class ClusterSnapshotUpdateView(View):

	def _get_cluster(self, player_class, game_format, cluster_id):
		player_class_enum = CardClass[player_class.upper()]
		game_format_enum = FormatType[game_format.upper()]
		cluster = ClusterSnapshot.objects.filter(
			class_cluster__player_class=player_class_enum,
			class_cluster__cluster_set__latest=True,
			class_cluster__cluster_set__game_format=game_format_enum,
			cluster_id=int(cluster_id)
		).first()
		return cluster

	def _get_existing_cluster_for_archetype(
		self,
		player_class,
		game_format,
		archetype_id,
		exclude_cluster_id=None
	):
		player_class_enum = CardClass[player_class.upper()]
		game_format_enum = FormatType[game_format.upper()]
		result = ClusterSnapshot.objects.filter(
			class_cluster__player_class=player_class_enum,
			class_cluster__cluster_set__latest=True,
			class_cluster__cluster_set__game_format=game_format_enum,
			external_id=int(archetype_id)
		)
		if exclude_cluster_id is not None:
			result = result.exclude(cluster_id=int(exclude_cluster_id))
		return result.first()

	def get(self, request, game_format, player_class, cluster_id):
		cluster = self._get_cluster(player_class, game_format, cluster_id)
		return JsonResponse({"cluster_id": cluster.cluster_id}, status=200)

	def patch(self, request, game_format, player_class, cluster_id):
		cluster = self._get_cluster(player_class, game_format, cluster_id)

		if not cluster:
			raise Http404("Cluster not found")

		payload = json.loads(request.body.decode())
		archetype_id = payload.get("archetype_id", None)
		class_cluster = cluster.class_cluster

		if not archetype_id:
			# We are removing an archetype assignment from a cluster
			cluster.external_id = None
			cluster.name = "NEW"
			cluster._augment_data_points()
			cluster.save()

		else:
			# We are adding an archetype assignment
			# First check whether the archetype is already assigned to a cluster
			existing_cluster_for_archetype = self._get_existing_cluster_for_archetype(
				player_class,
				game_format,
				archetype_id,
				exclude_cluster_id=cluster.cluster_id
			)
			if existing_cluster_for_archetype:
				# We are merging this cluster into the one that already exists
				class_cluster.merge_cluster_into_external_cluster(
					existing_cluster_for_archetype,
					cluster
				)

				# Delete both the old clusters, a new one has been created
				cluster.delete()
				existing_cluster_for_archetype.delete()

			else:
				# This is the first cluster getting assigned to the archetype
				archetype = Archetype.objects.get(id=int(archetype_id))
				cluster.external_id = int(archetype_id)
				cluster.name = archetype.name
				cluster._augment_data_points()
				cluster.save()

		# Changing external_id assignments affects CCP_signatures
		# So call update_cluster_signatures() to recalculate
		class_cluster.update_cluster_signatures(
			use_pcp_adjustment=False
		)
		for cluster in class_cluster.clusters:
			cluster.save()

		return JsonResponse({"msg": "OKAY"}, status=200)
