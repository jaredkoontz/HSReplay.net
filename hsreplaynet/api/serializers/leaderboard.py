from allauth.socialaccount.models import SocialAccount
from hearthstone.enums import BnetRegion
from rest_framework.fields import IntegerField, SerializerMethodField
from rest_framework.serializers import ModelSerializer


class LeaderboardSerializer(ModelSerializer):
	"""Serializer for leaderboard data sets."""

	class Meta:
		model = SocialAccount
		fields = ("user_id", "battletag", "leaderboard_rank", "total_games", "winrate")

	user_id = IntegerField()  # The HSReplay.net user id
	battletag = SerializerMethodField()  # The ranked user's battletag

	leaderboard_rank = SerializerMethodField()  # The user's rank on the leaderboard
	total_games = SerializerMethodField()  # The total number of games considered
	winrate = SerializerMethodField()  # The user's winrate over the considered games

	def __init__(self, data, *args, **kwargs):
		"""Constructor.

		Expects a queryset over SocialAccount models as its data argument. Requires a
		"context" argument with a "redshift_query_data" property giving the results of the
		"account_lo_leaderboard_by_winrate" or "account_lo_archetype_leaderboard_by_winrate"
		queries pivoted onto account_lo.
		"""

		super().__init__(data, *args, **kwargs)

		self._redshift_query_data = kwargs["context"]["redshift_query_data"]

	def to_representation(self, instance):
		region_str = "REGION_%s" % instance.extra_data.get("region").upper()

		battletag = instance.extra_data.get("battletag")
		region_acount_lo = "%s_%s" % (BnetRegion[region_str].value, instance.uid)

		leaderboard_entry = self._redshift_query_data[region_acount_lo]

		return dict(
			battletag=battletag,
			leaderboard_rank=leaderboard_entry["leaderboard_rank"],
			total_games=leaderboard_entry["total_games"],
			user_id=instance.user_id,
			winrate=leaderboard_entry["winrate"]
		)
