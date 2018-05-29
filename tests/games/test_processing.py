from unittest.mock import ANY, Mock

import pytest
from django.db.models import signals
from django.utils import timezone
from django_hearthstone.cards.models import Card
from djstripe.signals import on_delete_subscriber_purge_customer
from hearthstone.enums import BnetGameType, BnetRegion, CardClass, FormatType

from hearthsim.identity.accounts.models import BlizzardAccount, User
from hsreplaynet.decks.models import Archetype, Deck
from hsreplaynet.games.models import GameReplay, GlobalGame, GlobalGamePlayer
from hsreplaynet.games.processing import update_replay_feed


@pytest.fixture
def disconnect_post_delete():
	signals.pre_delete.disconnect(receiver=on_delete_subscriber_purge_customer, sender=User)
	yield
	signals.pre_delete.connect(receiver=on_delete_subscriber_purge_customer, sender=User)


@pytest.fixture
@pytest.mark.django_db
def user():
	return User.objects.create_user(
		username="test", email="test@example.com", is_fake=True, password="password")


def _create_player(name, id, deck, game):
	blizzard_account = BlizzardAccount(
		account_hi=id,
		account_lo=id,
		region=BnetRegion.REGION_US
	)
	blizzard_account.save()

	player = GlobalGamePlayer(
		name=name,
		player_id=id,
		deck_list=deck,
		game=game,
		hero=Card.objects.get(pk="HERO_01"),
		is_first=True,
		pegasus_account=blizzard_account,
		rank=25
	)
	player.save()


@pytest.mark.django_db
@pytest.mark.usefixtures("disconnect_post_delete")
def test_update_replay_feed_deleted_user(mocker, user):
	game = GlobalGame(
		format=FormatType.FT_STANDARD,
		game_type=BnetGameType.BGT_RANKED_STANDARD,
		match_end=timezone.now()
	)
	game.save()

	archetype = Archetype(name="Test Archetype", player_class=CardClass.WARRIOR)
	archetype.save()

	deck = Deck(archetype=archetype)
	deck.save()

	_create_player("Test 1", 1, deck, game)
	_create_player("Test 2", 2, deck, game)

	replay = GameReplay(global_game=game, user=user)
	replay.save()

	user.delete()

	mock_replay_feed = Mock()
	mocker.patch(
		"hsreplaynet.games.processing.get_replay_feed",
		new=lambda comparator: mock_replay_feed
	)

	update_replay_feed(replay)
	mock_replay_feed.push.assert_called_once_with({
		"id": ANY,

		"player1_archetype": 1,
		"player1_legend_rank": None,
		"player1_rank": 25,
		"player1_won": False,

		"player2_archetype": 1,
		"player2_legend_rank": None,
		"player2_rank": 25,
		"player2_won": False
	})
