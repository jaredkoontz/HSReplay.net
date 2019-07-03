from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from django_hearthstone.cards.models import Card

from hsreplaynet.decks.models import Archetype


class StaticViewSitemap(Sitemap):
	priority = 1.0

	def items(self):
		return [
			"home",
			"trending_decks",
			"meta_overview",
			"decks",
			"cards",
			"downloads",
			"premium",
		]

	def changefreq(self, item):
		if item in ["home", "premium", "downloads"]:
			return "weekly"
		return "daily"

	def location(self, item):
		return reverse(item)


class CardSitemap(Sitemap):
	def items(self):
		return Card.objects.all().filter(collectible=True)

	def priority(self, card):
		return 0.6

	def changefreq(self, card):
		return "daily"


class ArchetypeSitemap(Sitemap):
	changefreq = "daily"
	priority = 0.8

	def items(self):
		return Archetype.objects.live()


SITEMAPS = {
	"static": StaticViewSitemap,
	"cards": CardSitemap,
	"archetypes": ArchetypeSitemap,
}
