from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from django_hearthstone.cards.models import Card

from hsreplaynet.decks.models import Archetype


class StaticViewSitemap(Sitemap):
	changefreq = "daily"
	priority = 1.0

	def items(self):
		return [
			"home",
			"trending_decks",
			"decks",
			"cards",
			"premium",
		]

	def changefreq(self, item):
		if item in ["home", "premium"]:
			return "weekly"
		return "daily"

	def location(self, item):
		return reverse(item)


class CardSitemap(Sitemap):
	changefreq = "daily"

	def items(self):
		return Card.objects.all()

	def priority(self, card):
		if not card.collectible:
			return 0.4
		return 0.6

	def changefreq(self, card):
		if not card.collectible:
			return "monthly"
		return "daily"


class ArchetypeSitemap(Sitemap):
	changefreq = "daily"
	priority = 0.8

	def items(self):
		return Archetype.objects.exclude(deleted=True)


SITEMAPS = {
	"static": StaticViewSitemap,
	"cards": CardSitemap,
	"archetypes": ArchetypeSitemap,
}
