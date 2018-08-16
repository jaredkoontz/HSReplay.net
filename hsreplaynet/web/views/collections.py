from django.contrib.auth.mixins import LoginRequiredMixin
from django.utils.text import format_lazy
from django.utils.translation import gettext_lazy as _

from hearthsim.identity.accounts.models import BlizzardAccount

from . import SimpleReactView


class MyCollectionView(LoginRequiredMixin, SimpleReactView):
	title = _("My Collection")
	bundle = "collection"
	bundles = ("stats", "collection")

	def get_react_context(self):
		visibility = self.request.user.settings.get("collection-visibility", "private")
		return {
			"owner": True,
			"visibility": visibility
		}


class CollectionView(SimpleReactView):
	title = _("Collection")
	bundle = "collection"
	bundles = ("stats", "collection")

	def get_react_context(self):
		region = self.kwargs.get("region", 0)
		lo = self.kwargs.get("lo", 0)
		try:
			account = BlizzardAccount.objects.get(region=region, account_lo=lo)
		except BlizzardAccount.DoesNotExist:
			return {}

		self.request.head.title = format_lazy(
			_("{user}'s Hearthstone Collection"),
			user=str(account.battletag)
		)

		return {
			"region": region,
			"account_lo": lo,
			"owner": False,
			"battletag": account.battletag,
		}
