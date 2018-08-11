from django.conf import settings
from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpResponseForbidden
from django.shortcuts import redirect
from django.utils.http import is_safe_url
from django.views.generic import View

from hearthsim.identity.accounts.models import AccountClaim
from hsreplaynet.games.models import GameReplay
from hsreplaynet.utils import get_uuid_object_or_404, log
from hsreplaynet.utils.influx import influx_metric


class ClaimAccountView(LoginRequiredMixin, View):
	def get_redirect_url(self, request):
		url = request.GET.get("next", "")
		if url and is_safe_url(url, allowed_hosts=None):
			return url
		return settings.LOGIN_REDIRECT_URL

	def get(self, request, id):
		claim = get_uuid_object_or_404(AccountClaim, id=id)
		log.info("Claim %r: Token=%r, User=%r", claim, claim.token, claim.token.user)
		if claim.token.user:
			if claim.token.user.is_fake:
				count = GameReplay.objects.filter(user=claim.token.user).update(user=request.user)
				log.info("Updated %r replays. Deleting %r.", count, claim.token.user)
				# For now we just delete the fake user, because we are not using it.
				claim.token.user.delete()
			else:
				log.warning("%r is a real user. Deleting %r.", claim.token.user, claim)
				# Something's wrong. Get rid of the claim and reject the request.
				claim.delete()
				influx_metric("hsreplaynet_account_claim", {"count": 1}, error=1)
				return HttpResponseForbidden("This token has already been claimed.")
		claim.token.user = request.user
		claim.token.save()
		claim.delete()
		messages.info(request, "You have claimed your account. Nice!")
		influx_metric("hsreplaynet_account_claim", {"count": 1})
		return redirect(self.get_redirect_url(request))
