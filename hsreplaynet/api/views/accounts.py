from allauth.socialaccount.models import SocialAccount
from django.contrib.admin.models import ADDITION, CHANGE, LogEntry
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from hearthstone.enums import BnetRegion
from oauth2_provider.contrib.rest_framework import OAuth2Authentication
from oauth2_provider.models import AccessToken
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import ValidationError
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.status import (
	HTTP_200_OK, HTTP_201_CREATED, HTTP_204_NO_CONTENT, HTTP_400_BAD_REQUEST
)
from rest_framework.views import APIView

from hearthsim.identity.accounts.models import AuthToken, BlizzardAccount
from hearthsim.identity.oauth2.permissions import OAuth2HasScopes
from hsreplaynet.games.models import GameReplay
from hsreplaynet.utils import get_uuid_object_or_404
from hsreplaynet.utils.influx import influx_metric

from ..serializers.accounts import (
	AccountHiLoRegionSerializer, BlizzardAccountSerializer, ClaimTokenSerializer,
	FrontendUserSerializer, ThirdPartyApplicationUserSerializer, UserSerializer
)
from ..serializers.socialaccount import TwitchSocialAccountSerializer


class UserDetailsView(RetrieveAPIView):
	queryset = get_user_model().objects.all()
	authentication_classes = (SessionAuthentication, OAuth2Authentication)
	permission_classes = (IsAuthenticated, )

	def get_object(self):
		return self.request.user

	def get_serializer_class(self):
		if not self.request.auth:
			# SessionAuthentication
			return FrontendUserSerializer
		if isinstance(self.request.auth, AccessToken) and \
			self.request.auth.allow_scopes(["fullaccess"]):
			# privileged OAuth clients (e.g. first party deck trackers)
			return UserSerializer
		# Third parties, e.g. other OAuth clients
		return ThirdPartyApplicationUserSerializer


class UnlinkBlizzardAccountView(APIView):
	authentication_classes = (SessionAuthentication, OAuth2Authentication)
	permission_classes = (IsAuthenticated, )
	serializer_class = AccountHiLoRegionSerializer

	def delete(self, request):
		serializer = self.serializer_class(data=request.GET)
		serializer.is_valid(raise_exception=True)

		params = {
			"user": request.user,
			"account_lo": serializer.validated_data["account_lo"],
		}
		# We allow specifying either `account_hi` or `region`.
		# So we have to pass the appropriate pair of parameters to find the account.
		# The existence of the parameters is checked in the serializer itself.
		for key in ("account_hi", "region"):
			if key in serializer.validated_data:
				params[key] = serializer.validated_data[key]

		blizzard_account = BlizzardAccount.objects.filter(**params).first()
		if not blizzard_account:
			return Response({
				"error": "account_not_found",
				"detail": "Could not find a matching Blizzard Account owned by this user.",
			}, status=HTTP_400_BAD_REQUEST)

		changes = [{"changed": {
			"fields": ["user_id"],
			"before": [blizzard_account.user_id],
			"after": [None],
		}}]

		if hasattr(request.auth, "application") and not request.auth.application.livemode:
			# Do nothing in test mode.
			return Response({
				"error": "test_mode",
				"detail": "This API is a no-op in test mode.",
				"extra": changes,
			}, status=HTTP_200_OK)

		with transaction.atomic():
			blizzard_account.user = None
			blizzard_account.save()

			content_type = ContentType.objects.get(app_label="accounts", model="blizzardaccount")
			with transaction.atomic():
				# Ensure we save the model and the LogEntry at the same time.
				# LogEntry allows us to have some way to audit the API changes.
				blizzard_account.save()
				LogEntry.objects.log_action(
					user_id=self.request.user.pk,
					content_type_id=content_type.pk,
					object_id=blizzard_account.pk,
					object_repr=repr(blizzard_account),
					action_flag=CHANGE,
					change_message=changes,
				)

		return Response(status=HTTP_200_OK)


class UpdateBlizzardAccountView(APIView):
	authentication_classes = (OAuth2Authentication, )  # Not available in session
	serializer_class = BlizzardAccountSerializer

	def post(self, request, hi, lo):
		hi, lo = int(hi), int(lo)
		blizzard_account = BlizzardAccount.objects.filter(account_hi=hi, account_lo=lo).first()
		serializer = self.serializer_class(data=request.data)
		serializer.is_valid(raise_exception=True)

		battletag = serializer.validated_data["battletag"]

		if blizzard_account:
			changes = self.update_blizzard_account(blizzard_account, battletag)
			action_flag = CHANGE
			status_code = HTTP_200_OK
		else:
			blizzard_account, changes = self.create_blizzard_account(hi, lo, battletag)
			action_flag = ADDITION
			status_code = HTTP_201_CREATED

		if not request.auth.application.livemode:
			# Do nothing in test mode.
			return Response({
				"error": "test_mode",
				"detail": "This API is a no-op in test mode.",
				"extra": changes,
			}, status=status_code)

		if changes:
			changes.append({"_oauth2_token_id": str(request.auth.pk)})

			content_type = ContentType.objects.get(app_label="accounts", model="blizzardaccount")
			with transaction.atomic():
				# Ensure we save the model and the LogEntry at the same time.
				# LogEntry allows us to have some way to audit the API changes.
				blizzard_account.save()
				LogEntry.objects.log_action(
					user_id=self.request.user.pk,
					content_type_id=content_type.pk,
					object_id=blizzard_account.pk,
					object_repr=repr(blizzard_account),
					action_flag=action_flag,
					change_message=changes,
				)

		return Response(status=status_code)

	def create_blizzard_account(self, hi, lo, battletag):
		blizzard_account = BlizzardAccount(
			account_hi=hi,
			account_lo=lo,
			region=BnetRegion.from_account_hi(hi),
		)
		changes = [{"added": {}}]
		return blizzard_account, changes

	def update_blizzard_account(self, blizzard_account, battletag):
		changes = []
		if blizzard_account.user is None:
			# Claim unclaimed accounts
			changes.append({"changed": {
				"fields": ["user_id"],
				"before": [blizzard_account.user_id],
				"after": [self.request.user.pk]
			}})
			blizzard_account.user = self.request.user
		elif blizzard_account.user != self.request.user:
			# We don't want to allow claiming accounts which have already been claimed.
			raise ValidationError({
				"error": "account_already_claimed",
				"detail": "This Blizzard account is already owned by someone else."
			})

		if blizzard_account.battletag != battletag:
			# Update the battletag if it doesn't match.
			changes.append({"changed": {
				"fields": ["battletag"],
				"before": [blizzard_account.battletag],
				"after": [battletag]
			}})
			blizzard_account.battletag = battletag

		return changes


class ClaimTokenAPIView(APIView):
	serializer_class = ClaimTokenSerializer
	authentication_classes = (OAuth2Authentication, )

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

		return Response(status=HTTP_204_NO_CONTENT)


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
