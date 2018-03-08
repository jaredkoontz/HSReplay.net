from allauth.socialaccount.models import SocialAccount
from django.contrib.auth import get_user_model
from django.db import transaction
from oauth2_provider.contrib.rest_framework import OAuth2Authentication
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import ValidationError
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from hearthsim.identity.accounts.api import UserSerializer
from hearthsim.identity.accounts.models import AuthToken
from hearthsim.identity.oauth2.permissions import OAuth2HasScopes
from hsreplaynet.games.models import GameReplay
from hsreplaynet.utils import get_uuid_object_or_404
from hsreplaynet.utils.influx import influx_metric

from ..serializers.accounts import ClaimTokenSerializer, TwitchSocialAccountSerializer


class UserDetailsView(RetrieveAPIView):
	queryset = get_user_model().objects.all()
	serializer_class = UserSerializer
	authentication_classes = (OAuth2Authentication, )
	permission_classes = (IsAuthenticated, )

	def get_object(self):
		return self.request.user


class ClaimTokenAPIView(APIView):
	serializer_class = ClaimTokenSerializer
	authentication_classes = (SessionAuthentication, OAuth2Authentication)

	def post(self, request):
		serializer = self.serializer_class(data=request.data)
		serializer.is_valid(raise_exception=True)
		assert not request.user.is_fake
		token = get_uuid_object_or_404(AuthToken, key=serializer.validated_data["token"])

		if token.user and not token.user.is_fake:
			influx_metric("hsreplaynet_account_claim", {"count": 1}, error=1)
			raise ValidationError({
				"error": "token_already_claimed", "detail": "This token has already been claimed."
			})

		with transaction.atomic():
			# Update the token's replays to match the new user
			replays_claimed = GameReplay.objects.filter(user=token.user).update(user=request.user)
			if token.user:
				# Delete the token-specific fake user
				# If there was no user attached to the token, claiming it will attach the correct user.
				token.user.delete()
			# Update the token's actual user
			token.user = request.user
			# Save.
			token.save()

		influx_metric("hsreplaynet_account_claim", {"count": 1, "replays": replays_claimed})

		return Response({})


class TwitchSocialAccountListView(ListAPIView):
	queryset = SocialAccount.objects.filter(provider="twitch")
	authentication_classes = (SessionAuthentication, OAuth2Authentication)
	permission_classes = (
		OAuth2HasScopes(read_scopes=["account.social:read"], write_scopes=[]),
	)
	serializer_class = TwitchSocialAccountSerializer

	def get_queryset(self):
		queryset = super().get_queryset()
		return queryset.filter(user=self.request.user)
