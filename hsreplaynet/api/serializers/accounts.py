from allauth.socialaccount.models import SocialAccount
from oauth2_provider.models import AccessToken
from rest_framework.serializers import (
	CharField, HyperlinkedModelSerializer, Serializer, SerializerMethodField, UUIDField
)

from hearthsim.identity.accounts.api import UserSerializer


class UserDetailsSerializer(UserSerializer):
	_has_connected_hdt = SerializerMethodField("has_connected_hdt")

	def has_connected_hdt(self, instance):
		# This is a temporary field to support the oauth transition flow
		tokens = AccessToken.objects.filter(
			user=instance,
			application=3
		)
		return len(tokens) > 0


class BlizzardAccountSerializer(Serializer):
	battletag = CharField(max_length=64)


class ClaimTokenSerializer(Serializer):
	token = UUIDField()


class TwitchSocialAccountSerializer(HyperlinkedModelSerializer):
	extra_data = SerializerMethodField()
	user = UserSerializer()

	class Meta:
		model = SocialAccount
		fields = ("uid", "provider", "extra_data", "user")

	def get_extra_data(self, instance):
		# This method is needed because the JSONField used by allauth
		# is not the postgres JSONField and the API returns raw json
		# instead of a converted object.
		return instance.extra_data
