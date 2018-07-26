from oauth2_provider.contrib.rest_framework.authentication import OAuth2Authentication
from oauth2_provider.models import get_application_model


class OAuth2SecretKeyAuthentication(OAuth2Authentication):
	def authenticate(self, request):
		Application = get_application_model()
		secret = request.META.get("HTTP_AUTHORIZATION", "")
		if not secret.startswith("Bearer "):
			return
		secret = secret[len("Bearer "):]
		return Application.objects.filter(client_secret=secret).first()
