from datetime import datetime
from unittest.mock import Mock, patch

import pytest
from rest_framework.test import APIRequestFactory

from hearthsim.identity.accounts.models import BlizzardAccount, User
from hsreplaynet.api.views.leaderboard import (
	ArchetypeLeaderboardView, DelegatingLeaderboardView, LeaderboardView
)
from hsreplaynet.features.models import Feature, FeatureStatus


class BaseLeaderboardTest:

	def _stub_redshift_query(self, mocker, result=None):
		return_value = Mock(
			result_as_of=datetime.utcnow(),
			result_available=True,
			response_payload=result
		) if result else Mock(result_available=False)

		attrs = {"build_full_params.return_value": return_value}
		mocker.patch(
			"hsreplaynet.api.views.leaderboard.get_redshift_query", lambda _: Mock(**attrs)
		)

		return mocker.patch("hsreplaynet.api.views.leaderboard.trigger_if_stale")

	@staticmethod
	def _create_blizzard_account(account_lo, battletag, user):
		BlizzardAccount(
			account_hi=123,
			account_lo=account_lo,
			region=1,
			battletag=battletag,
			user=user
		).save()


TEST_LEADERBOARD = {
	"ALL": [{
		"region": 1,
		"account_lo": "161507049",
		"player_class": "ALL",
		"winrate": 72.88,
		"total_games": 118,
		"leaderboard_rank": 1
	}, {
		"region": 1,
		"account_lo": "52359536",
		"player_class": "ALL",
		"winrate": 69.56,
		"total_games": 115,
		"leaderboard_rank": 2
	}, {
		"region": 1,
		"account_lo": "52857578",
		"player_class": "ALL",
		"winrate": 69.06,
		"total_games": 139,
		"leaderboard_rank": 3
	}],
	"PALADIN": [{
		"region": 1,
		"account_lo": "157404837",
		"player_class": "PALADIN",
		"winrate": 65.13,
		"total_games": 109,
		"leaderboard_rank": 1
	}, {
		"region": 1,
		"account_lo": "27572930",
		"player_class": "PALADIN",
		"winrate": 60.74,
		"total_games": 135,
		"leaderboard_rank": 2
	}, {
		"region": 1,
		"account_lo": "157833312",
		"player_class": "PALADIN",
		"winrate": 60,
		"total_games": 125,
		"leaderboard_rank": 3
	}]
}


class TestLeaderboardView(BaseLeaderboardTest):

	def _create_request(self, player_class="ALL"):
		return APIRequestFactory().get(
			"/api/v1/leaderboard/?Region=%s&GameType=%s&TimeRange=%s&PlayerClass=%s" % (
				"REGION_US",
				"RANKED_STANDARD",
				"CURRENT_EXPANSION",
				player_class
			)
		)

	@pytest.fixture(autouse=True)
	def setup_method(self, db):
		Feature(name="leaderboards", status=FeatureStatus.PUBLIC).save()

	@pytest.mark.django_db
	def test_simple(self, mocker):
		user1 = User.objects.create_user("testplayer1")
		user2 = User.objects.create_user("testplayer2")
		user3 = User.objects.create_user("testplayer3")

		self._create_blizzard_account(161507049, "TestPlayer1#123", user1)
		self._create_blizzard_account(52359536, "TestPlayer2#456", user2)
		self._create_blizzard_account(52857578, "TestPlayer3#789", user3)

		view = LeaderboardView.as_view()
		self._stub_redshift_query(mocker, {
			"render_as": "table",
			"series": {
				"metadata": {},
				"data": TEST_LEADERBOARD
			}
		})

		response = view(self._create_request())

		assert response.status_code == 200
		assert [dict(d) for d in response.data] == [{
			"user_id": user1.id,
			"battletag": "TestPlayer1#123",
			"winrate": 72.88,
			"total_games": 118,
			"leaderboard_rank": 1
		}, {
			"user_id": user2.id,
			"battletag": "TestPlayer2#456",
			"winrate": 69.56,
			"total_games": 115,
			"leaderboard_rank": 2
		}, {
			"user_id": user3.id,
			"battletag": "TestPlayer3#789",
			"winrate": 69.06,
			"total_games": 139,
			"leaderboard_rank": 3
		}]

	@pytest.mark.django_db
	def test_player_class(self, mocker):
		user1 = User.objects.create_user("testplayer1")
		user2 = User.objects.create_user("testplayer2")
		user3 = User.objects.create_user("testplayer3")

		self._create_blizzard_account(157404837, "TestPlayer1#123", user1)
		self._create_blizzard_account(27572930, "TestPlayer2#456", user2)
		self._create_blizzard_account(157833312, "TestPlayer3#789", user3)

		view = LeaderboardView.as_view()
		self._stub_redshift_query(mocker, {
			"render_as": "table",
			"series": {
				"metadata": {},
				"data": TEST_LEADERBOARD
			}
		})

		response = view(self._create_request(player_class="PALADIN"))

		assert response.status_code == 200
		assert [dict(d) for d in response.data] == [{
			"user_id": user1.id,
			"battletag": "TestPlayer1#123",
			"winrate": 65.13,
			"total_games": 109,
			"leaderboard_rank": 1
		}, {
			"user_id": user2.id,
			"battletag": "TestPlayer2#456",
			"winrate": 60.74,
			"total_games": 135,
			"leaderboard_rank": 2
		}, {
			"user_id": user3.id,
			"battletag": "TestPlayer3#789",
			"winrate": 60,
			"total_games": 125,
			"leaderboard_rank": 3
		}]

	@pytest.mark.django_db
	def test_needs_refresh(self, client, mocker):
		view = LeaderboardView.as_view()
		trigger = self._stub_redshift_query(mocker)

		response = view(self._create_request())

		assert response.status_code == 202
		trigger.assert_called()


TEST_ARCHETYPE_LEADERBOARD = [{
	"region": 1,
	"account_lo": "92819470",
	"player_class": "PALADIN",
	"winrate": 66.07,
	"total_games": 112,
	"leaderboard_rank": 1
}, {
	"region": 1,
	"account_lo": "63468142",
	"player_class": "PALADIN",
	"winrate": 65.68,
	"total_games": 102,
	"leaderboard_rank": 2
}, {
	"region": 1,
	"account_lo": "29545528",
	"player_class": "PALADIN",
	"winrate": 65.09,
	"total_games": 106,
	"leaderboard_rank": 3
}]


class TestArchetypeLeaderboardView(BaseLeaderboardTest):

	def _create_request(self):
		return APIRequestFactory().get(
			"/api/v1/leaderboard/?archetype_id=%s&Region=%s&GameType=%s&TimeRange=%s" % (
				123,
				"REGION_US",
				"RANKED_STANDARD",
				"CURRENT_EXPANSION"
			)
		)

	@pytest.fixture(autouse=True)
	def setup_method(self, db):
		Feature(name="leaderboards", status=FeatureStatus.PUBLIC).save()

	@pytest.mark.django_db
	def test_simple(self, mocker):
		user1 = User.objects.create_user("testplayer1")
		user2 = User.objects.create_user("testplayer2")
		user3 = User.objects.create_user("testplayer3")

		self._create_blizzard_account(92819470, "TestPlayer1#123", user1)
		self._create_blizzard_account(63468142, "TestPlayer2#456", user2)
		self._create_blizzard_account(29545528, "TestPlayer3#789", user3)

		view = ArchetypeLeaderboardView.as_view()
		self._stub_redshift_query(mocker, {
			"render_as": "table",
			"series": {
				"metadata": {},
				"data": {
					"ALL": TEST_ARCHETYPE_LEADERBOARD
				}
			}
		})

		response = view(self._create_request())

		assert response.status_code == 200
		assert [dict(d) for d in response.data] == [{
			"user_id": user1.id,
			"battletag": "TestPlayer1#123",
			"winrate": 66.07,
			"total_games": 112,
			"leaderboard_rank": 1
		}, {
			"user_id": user2.id,
			"battletag": "TestPlayer2#456",
			"winrate": 65.68,
			"total_games": 102,
			"leaderboard_rank": 2
		}, {
			"user_id": user3.id,
			"battletag": "TestPlayer3#789",
			"winrate": 65.09,
			"total_games": 106,
			"leaderboard_rank": 3
		}]

	@pytest.mark.django_db
	def test_needs_refresh(self, client, mocker):
		view = ArchetypeLeaderboardView.as_view()
		trigger = self._stub_redshift_query(mocker)

		response = view(self._create_request())

		assert response.status_code == 202
		trigger.assert_called()


class TestDelegatingLeaderboardView:

	@patch.object(LeaderboardView, "as_view")
	@patch.object(ArchetypeLeaderboardView, "as_view")
	def test_dispatch_archetype_id_present(self, archetype_view, non_archetype_view):
		archetype_handler = Mock()
		archetype_view.return_value = archetype_handler

		view = DelegatingLeaderboardView.as_view()
		request = APIRequestFactory().get("/api/v1/leaderboard/?archetype_id=123")

		view(request)

		archetype_handler.assert_called_once_with(request)
		non_archetype_view.assert_not_called()

	@patch.object(LeaderboardView, "as_view")
	@patch.object(ArchetypeLeaderboardView, "as_view")
	def test_dispatch_archetype_id_absent(self, archetype_view, non_archetype_view):
		non_archetype_handler = Mock()
		non_archetype_view.return_value = non_archetype_handler

		view = DelegatingLeaderboardView.as_view()
		request = APIRequestFactory().get("/api/v1/leaderboard/")

		view(request)

		non_archetype_handler.assert_called_once_with(request)
		archetype_view.assert_not_called()
