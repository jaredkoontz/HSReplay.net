from django.http import Http404
from django.shortcuts import render
from django.utils.text import format_lazy
from django.utils.translation import gettext_lazy as _
from django.views.generic import TemplateView, View
from hearthstone.enums import FormatType

from hsreplaynet.decks.models import Deck

from . import SimpleReactView
from ..html import RequestMetaMixin


class DecksView(SimpleReactView):
	title = _("Hearthstone Decks")
	description = _(
		"Dive into the Hearthstone meta and find new decks by class, cards or "
		"game mode. Learn about their winrates and popularity on the ladder."
	)
	bundle = "decks"
	bundles = ("stats", "decks")


class MyDecksView(SimpleReactView):
	title = _("My Decks")
	bundle = "my_decks"
	bundles = ("stats", "my_decks")


class DeckDetailView(View):
	template_name = "decks/deck_detail.html"

	def get(self, request, id):
		try:
			deck = Deck.objects.get_by_shortid(id)
		except Deck.DoesNotExist:
			raise Http404(_("Deck does not exist."))

		cards = deck.card_dbf_id_list()
		if len(cards) != 30:
			raise Http404(_("Deck list is too small."))

		deck_name = str(deck)
		request.head.title = deck_name

		if deck.deck_class:
			request.head.add_meta(
				{"property": "x-hearthstone:deck", "content": deck_name},
				{"property": "x-hearthstone:deck:deckstring", "content": deck.deckstring},
			)

		self.request.head.add_meta({
			"name": "description",
			"content": format_lazy(
				_("{name} stats and decklist. Import it: {deckstring}"),
				name=deck_name, deckstring=deck.deckstring
			),
		})

		context = {
			"deck": deck,
			"deck_name": deck_name,
			"deck_is_wild": 1 if deck.format == FormatType.FT_WILD else 0,
			"card_list": ",".join(str(id) for id in cards),
		}
		return render(request, self.template_name, context)


class TrendingDecksView(RequestMetaMixin, TemplateView):
	template_name = "decks/trending.html"
	title = _("Trending Hearthstone Decks")
	description = _(
		"Find the up-and-coming decks with rising popularity in Hearthstone "
		"for each class updated every single day."
	)
