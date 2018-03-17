from allauth.socialaccount.models import SocialAccount
from rest_framework.serializers import HyperlinkedModelSerializer, SerializerMethodField

from .accounts import UserSerializer


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
