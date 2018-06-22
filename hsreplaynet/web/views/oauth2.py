from allauth.account.views import LoginView
from django.urls import reverse_lazy
from oauth2_provider.models import get_application_model
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
