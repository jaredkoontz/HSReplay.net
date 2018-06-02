from django.conf import settings
from django.http import Http404
from django.utils import translation
from django.utils.decorators import method_decorator
from django.views.generic import DetailView, TemplateView
from django_hearthstone.cards.models import Card
from hearthstone.enums import CardSet, CardType, Locale, Rarity

from hsreplaynet.features.decorators import view_requires_feature_access

from . import SimpleReactView
from ..html import RequestMetaMixin
from ..templatetags.web_extras import lang_to_blizzard


class CardsView(SimpleReactView):
	title = "Hearthstone Card Statistics"
	description = (
		"Compare statistics about all collectible Hearthstone cards. "
		"Find the cards that are played the most or have the highest winrate."
	)
	bundle = "cards"
	bundles = ("stats", "cards")

	def get_react_context(self):
		return {"view": "statistics"}


class MyCardsView(SimpleReactView):
	title = "My Cards"
	bundle = "cards"
	bundles = ("stats", "cards")

	def get_react_context(self):
		return {"view": "personal"}


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
