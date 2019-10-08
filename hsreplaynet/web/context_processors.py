from random import random

from django.conf import settings
from django.contrib.messages import get_messages
from django.urls import reverse
from django.utils import translation
from djpaypal.models import BillingPlan
from djpaypal.settings import PAYPAL_CLIENT_ID, PAYPAL_LIVE_MODE
from djstripe.enums import SubscriptionStatus
from djstripe.models import Plan
from djstripe.settings import STRIPE_LIVE_MODE, STRIPE_PUBLIC_KEY

from hsreplaynet.admin.models import AdUnit
from hsreplaynet.features.models import Feature
from hsreplaynet.features.utils import feature_enabled_for_user

from .i18n import lang_to_blizzard


def userdata(request):
	data = {
		"is_authenticated": request.user.is_authenticated,
		"locale": translation.get_language(),
		"hearthstone_locale": lang_to_blizzard(translation.get_language()),
		"languages": dict(settings.LANGUAGES),
		"stripe_pk": settings.STRIPE_PUBLIC_KEY,
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
				"lo": acc.account_lo,
				"battletag": acc.battletag,
				"region": acc.region,
				"display": str(acc),
			})
	else:
		data["login"] = {
			"default": reverse("account_login"),
			"blizzard": reverse("battlenet_login"),
			"blizzard_cn": reverse("battlenet_login") + "?region=cn",
		}
		if settings.DEBUG:
			data["login"]["password"] = data["login"]["default"] + "?with-password"

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

	if settings.DEBUG:
		data["debug"] = True

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
	just_subscribed = False
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

	promote_semiannual_sale = True
	if request.user.is_authenticated:
		if request.user.is_paypal_premium:
			promote_semiannual_sale = False
		else:
			customer = request.user.stripe_customer
			subscription = customer.subscription if customer else None
			plan = subscription.plan if subscription else None
			if request.user.is_stripe_premium and plan.stripe_id == settings.SEMIANNUAL_PLAN_ID:
				promote_semiannual_sale = False

	if "just-subscribed" in request.COOKIES:
		just_subscribed = True

	return {
		"site_email": settings.DEFAULT_FROM_EMAIL,
		"premium": is_premium,
		"promote_semiannual_sale": promote_semiannual_sale,
		"just_subscribed": just_subscribed,
		"has_subscription_past_due": has_subscription_past_due,
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


def ads(request):
	if not feature_enabled_for_user("ads", request.user):
		return {}
	ids = [au.name for au in AdUnit.objects.filter(enabled=True)]
	return {
		"ads": ids
	}


# Two things to note about Heap:
# 1) We have a very limited number of sessions available, so we need to
# *heavily* down sample. This is configured in LOCAL_SETTINGS.
# 2) We need to down sample *sessions*, not users or page views. Therefore
# we store the use_heap state in the current django session, which is
# our best approximation of heap sessions.
def heap_analytics(request):
	# "force-heap" feature can be enabled for testing purposes
	if feature_enabled_for_user("force-heap", request.user):
		return {
			"heap_analytics": {
				"app_id": settings.HEAP_APP_ID
			}
		}

	# Skip if Do Not Track is enabled
	if request.dnt:
		return {}

	# Skip if heap is not configured
	if not hasattr(settings, "HEAP_APP_ID") or not hasattr(settings, "HEAP_SAMPLING_PERCENT"):
		return {}

	# Handle existing sessions
	if request.session and "use_heap" in request.session:
		heap = request.session["use_heap"]
		if heap:
			return {
				"heap_analytics": {
					"app_id": settings.HEAP_APP_ID
				}
			}
		return {}

	# Down sample
	if random() > settings.HEAP_SAMPLING_PERCENT / 100.0:
		request.session["use_heap"] = False
		return {}

	request.session["use_heap"] = True
	return {
		"heap_analytics": {
			"app_id": settings.HEAP_APP_ID
		}
	}
