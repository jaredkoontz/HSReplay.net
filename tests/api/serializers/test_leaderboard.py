from hearthsim.identity.accounts.models import BlizzardAccount
from hsreplaynet.api.serializers.leaderboard import LeaderboardSerializer


class TestLeaderboardSerializer:

	def test_serializer_data(self, user):
		blizzard_account = BlizzardAccount(
			account_hi=123,
			account_lo=123456,
			region=1,
			battletag="Test#123",
			user=user
		)
		serializer = LeaderboardSerializer(
			blizzard_account,
			context={
				"redshift_query_data": {
					(1, 123455): {
						"region": 1,
						"account_lo": "123455",
						"player_class": "ALL",
						"winrate": 70.17,
						"total_games": 114,
						"leaderboard_rank": 1
					},
					(1, 123456): {
						"region": 1,
						"account_lo": "123456",
						"player_class": "ALL",
						"winrate": 70,
						"total_games": 130,
						"leaderboard_rank": 2
					},
					(1, 123457): {
						"region": 1,
						"account_lo": "123457",
						"player_class": "ALL",
						"winrate": 69.56,
						"total_games": 115,
						"leaderboard_rank": 3
					}
				}
			}
		)

		assert serializer.data == {
			"user_id": user.id,
			"battletag": "Test#123",
			"leaderboard_rank": 2,
			"total_games": 130,
			"winrate": 70
		}
