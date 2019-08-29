from django.http import HttpResponseRedirect
from django.utils.translation import gettext_lazy as _
from django_reflinks.models import ReferralLink
from shortuuid import ShortUUID

from . import SimpleReactView


class PremiumRequiredMixin:
	"""Verify that the current user is premium"""
	def dispatch(self, request, *args, **kwargs):
		if not request.user.is_premium:
			return HttpResponseRedirect("/premium/")
		return super().dispatch(request, *args, **kwargs)


class PremiumDetailView(SimpleReactView):
	title = _("HSReplay.net Premium")
	description = _(
		"More filters, more features, more data: Gain access to advanced "
		"Hearthstone statistics backed by millions of games with HSReplay.net Premium "
		"for HSReplay.net."
	)
	bundle = "premium_detail"

	def get_react_context(self):
		ret = {}

		user = self.request.user
		if user.is_authenticated:
			reflink = ReferralLink.objects.filter(user=user).first()
			if not reflink:
				reflink = ReferralLink.objects.create(
					identifier=ShortUUID().uuid()[:6], user=user
				)
			if not reflink.disabled:
				ret["reflink"] = "https://hsreplay.net" + reflink.get_absolute_url()
				ret["discount"] = "$2.50 USD"

		return ret
