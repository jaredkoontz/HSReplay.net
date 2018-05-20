from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.utils import timezone

from hearthsim.identity.accounts.models import BlizzardAccount
from hsreplaynet.utils import log
from hsreplaynet.utils.influx import influx_metric


ALWAYS_CAPTURE_EMAILS = True


class BattleNetAdapter(DefaultSocialAccountAdapter):
	def is_auto_signup_allowed(self, request, sociallogin):
		# Force users to pick a username if they don't have a battletag
		battletag = sociallogin.account.extra_data.get("battletag")
		if not battletag:
			return False

		if ALWAYS_CAPTURE_EMAILS:
			return False
		else:
			return super().is_auto_signup_allowed(request, sociallogin)

	def authentication_error(self, request, provider_id, error, exception, extra_context):
		# Triggered upon social network login failure.
		log.error("[%s] Authentication error: %r (exception=%r)", provider_id, error, exception)
		# Write the error details to Influx
		region = request.GET.get("region", "us")
		influx_metric(
			"hsreplaynet_socialauth_error",
			{"count": 1, "exception": str(exception)},
			provider_id=provider_id, error=error, region=region,
		)

	def new_user(self, request, sociallogin):
		battletag = sociallogin.account.extra_data.get("battletag", "")
		influx_metric(
			"hsreplaynet_socialauth_signup",
			{"count": 1},
			provider=sociallogin.account.provider,
			region=sociallogin.account.extra_data.get("region", "unknown"),
			has_battletag=bool(battletag),
		)
		ret = super().new_user(request, sociallogin)
		ret.battletag = battletag or ""
		return ret

	def save_user(self, request, sociallogin, form=None):
		user = super().save_user(request, sociallogin, form)

		if "email" in request.POST:
			marketing_prefs = request.POST.get("email_marketing", "") == "on"
			user.settings["email"] = {
				"marketing": marketing_prefs,
				"updated": timezone.now().isoformat(),
			}
			user.save()

		battletag = sociallogin.account.extra_data.get("battletag")
		if battletag:
			# Look for all BlizzardAccounts matching the battletag.
			accounts = BlizzardAccount.objects.filter(battletag=battletag)
			for account in accounts:
				# Then claim them.
				# NOTE: Don't use queryset.update() for triggers don't otherwise run
				account.user = user
				account.save()

		return user
