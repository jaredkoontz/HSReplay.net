from allauth.account.views import LoginView
from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpResponseBadRequest
from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse_lazy
from django.utils.text import format_lazy
from django.utils.translation import gettext_lazy as _
from django.views.generic import View
from oauth2_provider.generators import generate_client_secret
from oauth2_provider.models import get_access_token_model, get_application_model
from oauth2_provider.views import AuthorizationView as BaseAuthorizationView


class OAuth2LoginView(LoginView):
	def get_context_data(self):
		ret = super().get_context_data()
		Application = get_application_model()
		# Get the client ID, look for a matching client and pass it as context
		client_id = self.request.GET.get("client_id")
		ret["client_id"] = client_id
		ret["oauth2_client"] = Application.objects.filter(client_id=client_id).first()
		return ret


class OAuth2AuthorizeView(BaseAuthorizationView):
	login_url = reverse_lazy("oauth2_login")

	def get_login_url(self):
		# We override the login URL in order to pass the client_id to it
		client_id = self.request.GET.get("client_id")
		if client_id:
			return f"{self.login_url}?client_id={client_id}"
		return super().get_login_url()


class OAuth2RevokeView(LoginRequiredMixin, View):
	next = reverse_lazy("oauth2_app_list")

	def post(self, request):
		AccessToken = get_access_token_model()
		token = request.POST.get("token")
		if token:
			obj = get_object_or_404(AccessToken, token=token, user=self.request.user)
			obj.delete()
			messages.info(self.request, _("Access has been revoked."))
		return redirect(self.next)


##
# Application admin views


class BaseOAuth2ApplicationManageView(LoginRequiredMixin, View):
	def get_queryset(self):
		Application = get_application_model()
		return Application.objects.filter(user=self.request.user)

	def get_object(self):
		return self.get_queryset().filter(
			client_id=self.request.POST.get("client_id", "")
		).first()

	def post(self, request):
		application = self.get_object()
		if not application:
			return HttpResponseBadRequest("No valid application found.")
		self.handle(application)
		return redirect(application)

	def handle(self, application):
		raise NotImplementedError


class OAuth2RevokeAllTokensView(BaseOAuth2ApplicationManageView):
	def handle(self, application):
		count = application.accesstoken_set.all().delete()
		messages.info(
			self.request,
			format_lazy(_("{count} access tokens deleted."), count=count)
		)


class OAuth2ResetSecretView(BaseOAuth2ApplicationManageView):
	def handle(self, application):
		application.client_secret = generate_client_secret()
		if application.livemode:
			application.client_secret = "sk_live_" + application.client_secret
		else:
			application.client_secret = "sk_test_" + application.client_secret
		application.save()
