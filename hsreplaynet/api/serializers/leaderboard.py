from rest_framework.fields import CharField, IntegerField, SerializerMethodField
from rest_framework.serializers import ModelSerializer

from hearthsim.identity.accounts.models import BlizzardAccount


class LeaderboardSerializer(ModelSerializer):
	"""Serializer for leaderboard data sets."""

	class Meta:
		model = BlizzardAccount
		fields = ("user_id", "battletag", "leaderboard_rank", "total_games", "winrate")

	user_id = IntegerField(allow_null=True)  # The HSReplay.net user id
	battletag = CharField()  # The ranked user's battletag

	leaderboard_rank = SerializerMethodField()  # The user's rank on the leaderboard
	total_games = SerializerMethodField()  # The total number of games considered
	winrate = SerializerMethodField()  # The user's winrate over the considered games

	def __init__(self, data, *args, **kwargs):
		"""Constructor.

		Expects a queryset over BlizzardAccount models as its data argument. Requires a
		"context" argument with a "redshift_query_data" property giving the results of the
		"account_lo_leaderboard_by_winrate" or "account_lo_archetype_leaderboard_by_winrate"
		queries pivoted onto account_lo.
		"""

		super().__init__(data, *args, **kwargs)

		self._redshift_query_data = kwargs["context"]["redshift_query_data"]

	def get_leaderboard_rank(self, obj):
		return self._redshift_query_data[(obj.region, obj.account_lo)]["leaderboard_rank"]

	def get_total_games(self, obj):
		return self._redshift_query_data[(obj.region, obj.account_lo)]["total_games"]

	def get_winrate(self, obj):
		return self._redshift_query_data[(obj.region, obj.account_lo)]["winrate"]
