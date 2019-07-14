from django.conf import settings
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import Http404
from django.urls import reverse
from django.utils import translation
from django.utils.decorators import method_decorator
from django.utils.text import format_lazy, slugify
from django.utils.translation import gettext_lazy as _
from django.views.generic import TemplateView
from django_hearthstone.cards.models import Card
from hearthstone.enums import CardSet, CardType, Locale, Rarity
from unidecode import unidecode

from hsreplaynet.features.decorators import view_requires_feature_access
from hsreplaynet.web.views.premium import PremiumRequiredMixin

from ..html import RequestMetaMixin
from ..i18n import lang_to_blizzard
from . import SimpleReactView


class CardsView(SimpleReactView):
	title = _("Hearthstone Card Statistics")
	description = _(
		"Compare statistics about all collectible Hearthstone cards. "
		"Find the cards that are played the most or have the highest winrate."
	)
	bundle = "cards"
	bundles = ("stats", "cards")

	def get_react_context(self):
		return {"view": "statistics"}


class MyCardsView(LoginRequiredMixin, PremiumRequiredMixin, SimpleReactView):
	title = _("My Cards")
	bundle = "my_cards"
	bundles = ("stats", "my_cards")


class CardDetailView(SimpleReactView):
	model = Card
	bundle = "card_detail"
	bundles = ("stats", "card_detail")

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
			queryset = self.model.objects.all()

		pk = self.kwargs["pk"]
		if pk.isdigit():
			# If it's numeric, filter using the dbf id
			queryset = queryset.filter(dbf_id=pk)
		else:
			# Otherwise, use the card id
			queryset = queryset.filter(card_id=pk)

		try:
			obj = queryset.get()
			if obj.card_id == "PlaceholderCard":
				raise queryset.model.DoesNotExist
		except queryset.model.DoesNotExist:
			raise Http404(_("No card found matching the query."))

		locale = Locale[lang_to_blizzard(translation.get_language())]
		name = obj.localized_name(locale=locale)

		if not obj.includible:
			self.request.head.set_robots("noindex")

		self.request.head.set_canonical_url(obj.get_absolute_url())
		self.request.head.set_hreflang(lambda lang: self.get_hreflang(obj, lang))
		self.request.head.title = format_lazy(
			"{name} - {title}",
			name=name, title=_("Hearthstone Card Statistics")
		)
		self.request.head.opengraph["og:image"] = obj.get_card_art_url()
		self.request.head.opengraph["og:image:width"] = 256
		self.request.head.opengraph["og:image:height"] = 256

		card_desc = self.get_card_snippet(obj)
		description = format_lazy(
			"{name} - {card_desc} - {title}",
			name=name, card_desc=card_desc,
			title=_("Statistics and decks!")
		)
		self.request.head.add_meta(
			{"name": "description", "content": description},
			{"property": "og:description", "content": description},
		)

		return obj

	def get_react_context(self):
		card = self.get_object()
		return {
			"card_id": card.card_id,
			"dbf_id": card.dbf_id,
		}

	def get_hreflang(self, card, lang):
		locale = Locale[lang_to_blizzard(lang)]
		name = card.localized_name(locale=locale)
		slug = slugify(unidecode(name))
		return reverse("card_detail", kwargs={"pk": card.dbf_id, "slug": slug})


@method_decorator(view_requires_feature_access("cardeditor"), name="dispatch")
class CardEditorView(RequestMetaMixin, TemplateView):
	template_name = "cards/card_editor.html"
	title = _("Hearthstone Card Editor")
	scripts = (
		settings.SUNWELL_SCRIPT_URL,
	)
	stylesheets = (
		"fonts/belwefs_extrabold_macroman/stylesheet.css",
		"fonts/franklingothicfs_mediumcondensed_macroman/stylesheet.css",
	)
