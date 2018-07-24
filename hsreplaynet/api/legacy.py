from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework.generics import CreateAPIView
from rest_framework.mixins import CreateModelMixin, RetrieveModelMixin, UpdateModelMixin
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.status import HTTP_201_CREATED
from rest_framework.viewsets import GenericViewSet

from hearthsim.identity.accounts.models import AccountClaim, AuthToken
from hearthsim.identity.api.models import APIKey as LegacyAPIKey

from .serializers.accounts import UserSerializer


class LegacyAPIKeyPermission(BasePermission):
	"""
	Permission check for presence of an API Key header
	http://www.django-rest-framework.org/api-guide/permissions/
	"""

	HEADER_NAME = "X-Api-Key"

	def has_permission(self, request, view):
		header = "HTTP_" + self.HEADER_NAME.replace("-", "_").upper()
		key = request.META.get(header, "")
		if not key:
			return False

		try:
			api_key = LegacyAPIKey.objects.get(api_key=key)
		except (LegacyAPIKey.DoesNotExist, DjangoValidationError):
			return False

		request.api_key = api_key
		return api_key.enabled


class RequireAuthToken(BasePermission):
	def has_permission(self, request, view):
		if request.user and request.user.is_staff:
			return True
		return hasattr(request, "auth_token")


class AuthTokenAuthentication(TokenAuthentication):
	model = AuthToken

	def authenticate(self, request):
		user_token_tuple = super(AuthTokenAuthentication, self).authenticate(request)
		if user_token_tuple is not None:
			request.auth_token = user_token_tuple[1]
		return user_token_tuple

	def authenticate_credentials(self, key):
		model = self.get_model()
		try:
			token = model.objects.get(key=key)
		except (model.DoesNotExist, ValueError):
			raise AuthenticationFailed("Invalid token: %r" % (key))

		if token.user:
			if not token.user.is_active:
				raise AuthenticationFailed("User %r cannot sign in." % (token.user))

		return token.user, token


class AccountClaimSerializer(serializers.Serializer):
	url = serializers.ReadOnlyField(source="get_absolute_url")
	full_url = serializers.ReadOnlyField(source="get_full_url")
	created = serializers.ReadOnlyField()


class AuthTokenSerializer(serializers.HyperlinkedModelSerializer):
	key = serializers.UUIDField(read_only=True)
	user = UserSerializer(read_only=True)
	test_data = serializers.BooleanField(default=False)

	class Meta:
		model = AuthToken
		fields = ("key", "user", "test_data")

	def create(self, data):
		api_key = self.context["request"].api_key
		data["creation_apikey"] = api_key
		ret = super(AuthTokenSerializer, self).create(data)
		# Create a "fake" user to correspond to the AuthToken
		ret.create_fake_user(save=False)
		ret.save()
		return ret


class AuthTokenViewSet(
	CreateModelMixin, UpdateModelMixin, RetrieveModelMixin, GenericViewSet
):
	authentication_classes = (AuthTokenAuthentication, )
	permission_classes = (LegacyAPIKeyPermission, )
	queryset = AuthToken.objects.all()
	serializer_class = AuthTokenSerializer


class CreateAccountClaimView(CreateAPIView):
	"""
	Legacy account claim view. Use views.ClaimTokenAPIView instead.
	"""
	authentication_classes = (AuthTokenAuthentication, )
	permission_classes = (RequireAuthToken, LegacyAPIKeyPermission)
	queryset = AccountClaim.objects.all()
	serializer_class = AccountClaimSerializer

	def create(self, request):
		if request.auth_token.user and not request.auth_token.user.is_fake:
			raise ValidationError("This token has already been claimed.")
		claim, _ = AccountClaim.objects.get_or_create(
			token=request.auth_token,
			defaults={"api_key": request.api_key}
		)
		serializer = self.get_serializer(claim)
		headers = self.get_success_headers(serializer.data)
		response = Response(serializer.data, status=HTTP_201_CREATED, headers=headers)
		return response
