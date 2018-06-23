import logging

from allauth.socialaccount.models import SocialAccount
from django.contrib import messages
from django.contrib.auth import logout
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse, reverse_lazy
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.views.generic import (
	CreateView, DeleteView, ListView, TemplateView, UpdateView, View
)
from django_reflinks.models import ReferralHit, ReferralLink
from oauth2_provider.generators import generate_client_secret
from oauth2_provider.models import AccessToken, get_application_model
from shortuuid import ShortUUID

from hearthsim.identity.accounts.models import User
from hsreplaynet.utils import log
from hsreplaynet.utils.influx import influx_metric
from hsreplaynet.web.html import RequestMetaMixin
from hsreplaynet.webhooks.models import WebhookDelivery, WebhookEndpoint

from . import SimpleReactView


logger = logging.getLogger("hsreplaynet")


##
# Account management

class EditAccountView(LoginRequiredMixin, UpdateView, SimpleReactView):
	model = User
	fields = [
		"default_replay_visibility", "joust_autoplay", "exclude_from_statistics"
	]
	success_url = "/account/"
	title = _("My Account")
	bundle = "account_edit"
	base_template = "account/base.html"
	object = None

	def get_object(self, queryset=None):
		return self.request.user

	def get_react_context(self):
		reflink = ReferralLink.objects.filter(user=self.request.user).first()
		if not reflink:
			reflink = ReferralLink.objects.create(
				identifier=ShortUUID().uuid()[:6], user=self.request.user
			)

		if reflink.disabled:
			reflink_url = ""
		else:
			reflink_url = "https://hsreplay.net" + reflink.get_absolute_url()

		return {
			"default_replay_visibility": self.request.user.default_replay_visibility,
			"exclude_from_statistics": self.request.user.exclude_from_statistics,
			"joust_autoplay": self.request.user.joust_autoplay,
			"reflink": reflink_url,
			"hits": ReferralHit.objects.filter(
				referral_link=reflink
			).exclude(confirmed=None).count(),
		}


class APIAccountView(LoginRequiredMixin, RequestMetaMixin, View):
	template_name = "account/api.html"
	title = _("API Access")

	def get(self, request):
		context = {
			"tokens": request.user.auth_tokens.all(),
			"webhooks": request.user.webhook_endpoints.filter(is_deleted=False),
		}
		return render(request, self.template_name, context)


class DeleteAccountView(LoginRequiredMixin, SimpleReactView):
	success_url = reverse_lazy("home")
	title = _("Delete Account")
	bundle = "account_delete"
	base_template = "account/base.html"

	def can_delete(self):
		if self.request.user.is_staff:
			return False

		customer = self.request.user.stripe_customer

		# Fake users will not have a Stripe customer associated with them.

		if customer is not None:
			subscriptions = customer.active_subscriptions.filter(cancel_at_period_end=False)
			if subscriptions.count():
				# If the user has any active subscriptions that they did not cancel,
				# we prevent them from deleting their account in order to ensure
				# they confirm the cancellation of their subscription.
				return False

		return True

	def post(self, request):
		# Prevent staff and current subscribers from deleting accounts
		if not self.can_delete():
			messages.error(request, _("This account cannot be deleted."))
			return redirect("account_delete")

		logger.info(f"Deleting account: {request.user}")

		# Record reason and message in influx
		influx_metric("hsreplaynet_account_delete", {
			"count": 1,
			"message": request.POST.get("message", "")
		}, reason=request.POST.get("reason", ""))

		# Log out, then delete the account
		user = request.user
		logout(request)
		user.delete()
		return redirect(self.success_url)


class DeleteReplaysView(LoginRequiredMixin, RequestMetaMixin, TemplateView):
	template_name = "account/delete_replays.html"
	success_url = reverse_lazy("my_replays")
	title = "Delete replays"

	def post(self, request):
		# Record reason and message in influx
		influx_metric("hsreplaynet_replays_delete", {"count": 1})

		request.user.replays.update(is_deleted=True)
		messages.info(self.request, _("Your replays have been deleted."))

		return redirect(self.success_url)


class MakePrimaryView(LoginRequiredMixin, View):
	success_url = reverse_lazy("socialaccount_connections")

	def post(self, request):
		account = request.POST.get("account")
		try:
			socacc = SocialAccount.objects.get(id=account)
		except SocialAccount.DoesNotExist:
			return self.error(1)
		if socacc.user != request.user:
			# return HttpResponseForbidden("%r does not belong to you." % (socacc))
			return self.error(2)

		if socacc.provider != "battlenet":
			raise NotImplementedError("Making non-battlenet account primary is not implemented")

		battletag = socacc.extra_data.get("battletag")
		if battletag:
			if User.objects.filter(username=battletag).exists():
				# A user with that username already exists
				return self.error(3)
			request.user.battletag = battletag
			request.user.username = battletag
			request.user.save()

		return self.complete()

	def error(self, id):
		log.warning("%r got error %r when making account primary" % (self.request.user, id))
		influx_metric("hsreplaynet_make_primary", {"count": 1}, error=id)
		messages.error(self.request, _("Could not make account primary."))
		return redirect(self.success_url)

	def complete(self, success=True):
		influx_metric("hsreplaynet_make_primary", {"count": 1})
		return redirect(self.success_url)


class EmailPreferencesView(LoginRequiredMixin, View):
	success_url = reverse_lazy("account_email")

	def post(self, request):
		marketing_prefs = request.POST.get("marketing", "") == "on"

		request.user.settings["email"] = {
			"marketing": marketing_prefs,
			"updated": timezone.now().isoformat(),
		}
		request.user.save()

		messages.info(request, _("Your email preferences have been saved."))
		return redirect(self.success_url)


##
# Webhooks management


class WebhookFormMixin(LoginRequiredMixin, RequestMetaMixin):
	model = WebhookEndpoint
	template_name = "webhooks/detail.html"
	fields = ["url", "is_active"]
	success_url = reverse_lazy("account_api")


class WebhookCreateView(WebhookFormMixin, CreateView):
	title = _("Create a webhook")

	def form_valid(self, form):
		form.instance.creator = self.request.user
		form.instance.user = self.request.user
		return super().form_valid(form)


class WebhookUpdateView(WebhookFormMixin, UpdateView):
	context_object_name = "webhook"
	deliveries_limit = 25
	title = _("Update a webhook")

	def get_queryset(self):
		qs = super().get_queryset()
		return qs.filter(user=self.request.user, is_deleted=False)

	def get_context_data(self, **kwargs):
		context = super().get_context_data(**kwargs)
		context["deliveries"] = WebhookDelivery.objects.filter(
			webhook__endpoint=context["webhook"]
		)[:self.deliveries_limit]
		return context


class WebhookDeleteView(WebhookFormMixin, DeleteView):
	def get_queryset(self):
		qs = super().get_queryset()
		return qs.filter(user=self.request.user, is_deleted=False)


##
# OAuth2 management

Application = get_application_model()


class OAuth2ManageView(LoginRequiredMixin, SimpleReactView):
	bundle = "account_api"
	base_template = "account/base.html"
	title = _("OAuth Applications")

	def serialize_app(self, application) -> dict:
		ret = {
			"id": application.id,
			"client_id": application.client_id,
			"name": str(application),
			"description": application.description,
			"homepage": application.homepage,
		}

		if application.user == self.request.user:
			ret["token_count"] = application.accesstoken_set.count()
			ret["update_url"] = reverse("oauth2_app_update", kwargs={"pk": application.pk})

		return ret

	def get_react_context(self):
		ret = {
			"access_tokens": [],
			"applications": [],
			"urls": {
				"revoke_access": reverse("oauth2_revoke_access"),
			}
		}

		for token in AccessToken.objects.filter(user=self.request.user).order_by("-created"):
			ret["access_tokens"].append({
				"application": self.serialize_app(token.application),
				"token": token.token,
				"scopes": token.scopes,
				"created": token.created,
				"last_used": token.created,
			})

		for app in Application.objects.filter(user=self.request.user):
			ret["applications"].append(self.serialize_app(app))

		return ret


class ApplicationBaseView(LoginRequiredMixin, RequestMetaMixin, View):
	model = Application

	def get_queryset(self):
		return self.model.objects.filter(user=self.request.user)


class ApplicationUpdateView(ApplicationBaseView, UpdateView):
	template_name = "oauth2/application_update.html"
	fields = ("name", "description", "homepage", "redirect_uris")
	title = _("Your OAuth Application")


class ResetSecretView(ApplicationBaseView):
	def post(self, request, **kwargs):
		app = get_object_or_404(self.get_queryset(), pk=kwargs["pk"])
		app.client_secret = generate_client_secret()
		if app.livemode:
			app.client_secret = "sk_live_" + app.client_secret
		else:
			app.client_secret = "sk_test_" + app.client_secret
		app.save()
		return redirect(app)


class RevokeAllTokensView(ApplicationBaseView):
	def post(self, request, **kwargs):
		app = get_object_or_404(self.get_queryset(), pk=kwargs["pk"])
		app.accesstoken_set.all().delete()
		return redirect(app)


class UserRevocationView(LoginRequiredMixin, View):
	model = AccessToken
	next = reverse_lazy("oauth2_app_list")

	def post(self, request):
		token = request.POST.get("token")
		if token:
			obj = get_object_or_404(self.model, token=token)
			obj.delete()
			messages.info(self.request, _("Access has been revoked."))
		return redirect(self.next)
