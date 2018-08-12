from django.contrib.auth.mixins import LoginRequiredMixin
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
		account = BlizzardAccount.objects.get(region=region, account_lo=lo)
		return {
			"region": region,
			"account_lo": lo,
			"owner": False,
			"battletag": account.battletag if account else "Unknown"
		}
