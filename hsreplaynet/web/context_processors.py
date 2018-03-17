from django.conf import settings
from django.contrib.messages import get_messages
from django.utils import translation
from djpaypal.models import BillingPlan
from djpaypal.settings import PAYPAL_CLIENT_ID, PAYPAL_LIVE_MODE
from djstripe.enums import SubscriptionStatus
from djstripe.models import Plan
from djstripe.settings import STRIPE_LIVE_MODE, STRIPE_PUBLIC_KEY

from hsreplaynet.features.models import Feature

from .templatetags.web_extras import blizzard_lang


def userdata(request):
	data = {
		"is_authenticated": bool(request.user.is_authenticated),
		"card_art_url": settings.HEARTHSTONE_ART_URL,
		"hearthstone_locale": blizzard_lang(translation.get_language()),
	}

	storage = get_messages(request)
	data["messages"] = [{
		"level": m.level_tag, "tags": m.extra_tags, "text": m.message
	} for m in storage]

	if request.user.is_authenticated:
		data["userid"] = request.user.pk
		data["username"] = request.user.username
		data["email"] = request.user.email
		data["battletag"] = request.user.battletag

		if request.user.is_premium and not request.COOKIES.get("free-mode") == "true":
			data["premium"] = True

		if request.user.is_staff:
			data["staff"] = True

		data["accounts"] = []
		for acc in request.user.blizzard_accounts.all():
			data["accounts"].append({
				"hi": str(acc.account_hi),
				"lo": acc.account_lo,
				"battletag": acc.battletag,
				"region": acc.region,
				"display": str(acc),
			})

	data["features"] = {}
	for feature in Feature.objects.all():
		if not feature.enabled_for_user(request.user):
			continue

		data["features"][feature.name] = {"enabled": True}
		if feature.read_only:
			data["features"][feature.name]["read_only"] = True

	# IP country (geolocation done by Cloudflare)
	# Note: This is meant to be used as a hint; users can send it themselves.
	# Don't use it as an absolute.
	if "HTTP_CF_IPCOUNTRY" in request.META:
		data["ipcountry"] = request.META["HTTP_CF_IPCOUNTRY"]

	return {"userdata": data}


def debug(request):
	if not request.user.is_staff and not settings.DEBUG:
		return {}

	import django
	import sys

	return {
		"django_version": django.__version__,
		"python_version": sys.version,
	}


def premium(request):
	is_premium = request.user.is_authenticated and request.user.is_premium
	has_subscription_past_due = False
	if request.user.is_authenticated and request.user.stripe_customer:
		customer = request.user.stripe_customer
		has_subscription_past_due = customer.subscriptions.filter(
			status=SubscriptionStatus.past_due).exists()
	stripe_plans = Plan.objects.filter(livemode=STRIPE_LIVE_MODE)
	paypal_plans = BillingPlan.objects.filter(livemode=PAYPAL_LIVE_MODE)
	stripe_debug = not STRIPE_LIVE_MODE and settings.DEBUG

	if is_premium and request.COOKIES.get("free-mode") == "true":
		is_premium = False

	return {
		"premium": is_premium,
		"has_subscription_past_due": has_subscription_past_due,
		"show_premium_modal": not is_premium and "premium-modal" in request.GET,
		"stripe_monthly_plan": stripe_plans.filter(stripe_id=settings.MONTHLY_PLAN_ID).first(),
		"stripe_semiannual_plan": stripe_plans.filter(
			stripe_id=settings.SEMIANNUAL_PLAN_ID
		).first(),
		"paypal_monthly_plan": paypal_plans.filter(id=settings.PAYPAL_MONTHLY_PLAN_ID).first(),
		"paypal_semiannual_plan": paypal_plans.filter(
			id=settings.PAYPAL_SEMIANNUAL_PLAN_ID
		).first(),
		"stripe_debug": stripe_debug,
		"STRIPE_PUBLIC_KEY": STRIPE_PUBLIC_KEY,
		"PAYPAL_CLIENT_ID": PAYPAL_CLIENT_ID,
	}
