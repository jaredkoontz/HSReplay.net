from allauth.socialaccount.models import SocialAccount
from oauth2_provider.models import AccessToken
from rest_framework.serializers import (
	CharField, HyperlinkedModelSerializer, IntegerField,
	Serializer, SerializerMethodField, UUIDField
)


class UserSerializer(Serializer):
	id = IntegerField(read_only=True)
	battletag = SerializerMethodField()
	username = SerializerMethodField()
	is_premium = SerializerMethodField()
	blizzard_accounts = SerializerMethodField()
	tokens = SerializerMethodField()

	def get_battletag(self, instance):
		if "request" in self.context and self.context["request"].user == instance:
			return instance.battletag

	def get_blizzard_accounts(self, instance):
		if "request" in self.context and self.context["request"].user == instance:
			return [{
				"battletag": ba.battletag,
				"account_hi": ba.account_hi,
				"account_lo": ba.account_lo,
				"region": int(ba.region),
			} for ba in instance.blizzard_accounts.all()]

	def get_username(self, instance):
		if "request" in self.context and self.context["request"].user == instance:
			return instance.username

	def get_is_premium(self, instance):
		if "request" in self.context and self.context["request"].user == instance:
			return instance.is_premium

	def get_tokens(self, instance):
		if "request" in self.context and self.context["request"].user == instance:
			return [str(token.key) for token in instance.auth_tokens.all()]

	def to_representation(self, instance):
		if instance.is_fake:
			return None
		return super(UserSerializer, self).to_representation(instance)


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
