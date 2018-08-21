from rest_framework.exceptions import ValidationError
from rest_framework.serializers import (
	CharField, IntegerField, Serializer, SerializerMethodField, UUIDField
)


class SimpleUserSerializer(Serializer):
	battletag = SerializerMethodField()
	username = SerializerMethodField()

	def get_username(self, instance):
		if "request" in self.context and self.context["request"].user == instance:
			return instance.username

	def get_battletag(self, instance):
		if "request" in self.context and self.context["request"].user == instance:
			return instance.battletag

	def to_representation(self, instance):
		if instance.is_fake:
			return None
		return super().to_representation(instance)


class UserSerializer(SimpleUserSerializer):
	id = IntegerField(read_only=True)
	is_premium = SerializerMethodField()
	blizzard_accounts = SerializerMethodField()
	tokens = SerializerMethodField()

	def get_blizzard_accounts(self, instance):
		if "request" in self.context and self.context["request"].user == instance:
			return [{
				"battletag": ba.battletag,
				"account_hi": ba.account_hi,
				"account_lo": ba.account_lo,
				"region": int(ba.region),
			} for ba in instance.blizzard_accounts.all()]

	def get_is_premium(self, instance):
		if "request" in self.context and self.context["request"].user == instance:
			return instance.is_premium

	def get_tokens(self, instance):
		if "request" in self.context and self.context["request"].user == instance:
			return [str(token.key) for token in instance.auth_tokens.all()]


class UserDetailsSerializer(UserSerializer):
	_has_connected_hdt = SerializerMethodField("has_connected_hdt")

	def has_connected_hdt(self, instance):
		from oauth2_provider.models import AccessToken

		# This is a temporary field to support the oauth transition flow
		tokens = AccessToken.objects.filter(
			user=instance,
			application__in=[3, 8]
		)
		return len(tokens) > 0


class BlizzardAccountSerializer(Serializer):
	battletag = CharField(max_length=64)


class ClaimTokenSerializer(Serializer):
	token = UUIDField()


class AccountHiLoRegionSerializer(Serializer):
	account_hi = IntegerField(required=False)
	account_lo = IntegerField()
	region = IntegerField(required=False)

	def validate(self, data):
		data = super().validate(data)
		if "account_hi" not in data and "region" not in data:
			raise ValidationError({
				"account_hi": ["One of `account_hi` or `region` must be specified."],
				"region": ["One of `account_hi` or `region` must be specified."],
			})

		return data
