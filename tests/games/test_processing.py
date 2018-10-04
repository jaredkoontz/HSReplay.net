from datetime import datetime
from unittest.mock import ANY, Mock, patch

import fakeredis
import pytest
import pytz
from django.db.models import signals
from django.utils import timezone
from django_hearthstone.cards.models import Card
from djstripe.signals import on_delete_subscriber_purge_customer
from hearthstone.deckstrings import parse_deckstring
from hearthstone.enums import BnetGameType, BnetRegion, CardClass, FormatType
from moto import mock_dynamodb2
from pynamodb.connection import TableConnection
from pynamodb.exceptions import DoesNotExist, PutError
from pytest import raises
from shortuuid import ShortUUID

from hearthsim.identity.accounts.models import BlizzardAccount, User
from hsreplaynet.decks.models import Archetype, Deck, update_deck_archetype
from hsreplaynet.games.models import GameReplay, GlobalGame, GlobalGamePlayer
from hsreplaynet.games.processing import (
	get_globalgame_digest_v2_tags, has_twitch_vod_url, record_twitch_vod, update_replay_feed
)
from hsreplaynet.vods.models import TwitchVod


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


def _create_player(name, id, deck, game, rank=25, legend_rank=None, is_ai=False):
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
		is_ai=is_ai,
		is_first=True,
		pegasus_account=blizzard_account,
		rank=rank
	)

	if legend_rank:
		player.legend_rank = legend_rank

	player.save()
	return player


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

		"player1_archetype": archetype.id,
		"player1_legend_rank": None,
		"player1_rank": 25,
		"player1_won": False,

		"player2_archetype": archetype.id,
		"player2_legend_rank": None,
		"player2_rank": 25,
		"player2_won": False
	})


TEST_REPLAY_META = {
	"twitch_vod": {
		"channel_name": "My Hearthstone Channel",
		"url": "https://www.twitch.tv/videos/106400740?t=0h1m2s"
	}
}

TEST_TWITCH_DECK_STRING_1 = "AAECAa0GBggJxQTtBZAH0woMHu0BkAKXAqEE5QTJBtIK1QrWCtcK8gwA"
TEST_TWITCH_DECK_STRING_2 = \
	"AAECAa0GBsUEkAfXCs/HApDTAsvsAgyhBOUE0wryDNHBAtjBAsnHAujQAsvmAvzqAr3zAuP3AgA="

TEST_TWITCH_VOD_PARAMS = dict(
	format_type="FT_STANDARD",
	friendly_player_canonical_deck_string=TEST_TWITCH_DECK_STRING_1,
	friendly_player_name="Test Player 1",
	game_date=1531612800.0,
	game_length_seconds=300.0,
	game_type="BGT_RANKED_STANDARD",
	url=TEST_REPLAY_META["twitch_vod"]["url"],
	won=False,
	twitch_channel_name=TEST_REPLAY_META["twitch_vod"]["channel_name"]
)


def _create_replay(user, game, friendly_player_id=1):
	replay = GameReplay(
		user=user,
		global_game=game,
		friendly_player_id=friendly_player_id,
		shortid=ShortUUID().random()
	)
	replay.save()

	return replay


def _create_deck(deckstring, archetype_id=None):
	cards, heroes, format = parse_deckstring(deckstring)

	card_ids = []
	for card in cards:
		for _ in range(card[1]):
			card_ids.append(Card.objects.get(dbf_id=card[0]).id)

	deck_list, _ = Deck.objects.get_or_create_from_id_list(
		card_ids,
		hero_id=heroes[0],
		game_type=BnetGameType.BGT_RANKED_STANDARD
	)

	if archetype_id:
		archetype = Archetype(id=archetype_id)
		archetype.save()

		deck_list.archetype = archetype
		deck_list.save()

	return deck_list


@pytest.fixture
def twitch_vod_dynamodb_table(mocker):
	mocker.patch.multiple(
		"hsreplaynet.vods.models.TwitchVod.Meta",
		host=None,
		aws_access_key_id="test",
		aws_secret_access_key="test",
	)
	with mock_dynamodb2():
		TwitchVod.create_table(wait=True)
		yield
		TwitchVod.delete_table()


@pytest.fixture
@pytest.mark.django_db
def twitch_vod_game():
	game = GlobalGame(
		game_type=BnetGameType.BGT_RANKED_STANDARD,
		format=FormatType.FT_STANDARD,
		match_start=datetime(2018, 7, 15, tzinfo=pytz.utc),
		match_end=datetime(2018, 7, 15, minute=5, tzinfo=pytz.utc)
	)

	game.save()
	return game


@pytest.fixture
def disconnect_pre_save():
	signals.pre_save.disconnect(receiver=update_deck_archetype, sender=Deck)
	yield
	signals.pre_save.connect(receiver=update_deck_archetype, sender=Deck)


@pytest.mark.django_db
@pytest.mark.usefixtures("disconnect_pre_save", "twitch_vod_dynamodb_table")
def test_record_twitch_vod(user, twitch_vod_game):
	deck1 = _create_deck(TEST_TWITCH_DECK_STRING_1, archetype_id=123)
	deck2 = _create_deck(TEST_TWITCH_DECK_STRING_2)

	_create_player("Test Player 1", 1, deck1, twitch_vod_game, rank=25)
	_create_player("Test Player 2", 2, deck2, twitch_vod_game, rank=25)

	replay = _create_replay(user, twitch_vod_game)

	record_twitch_vod(replay, TEST_REPLAY_META)

	expected_vod = TwitchVod(
		friendly_player_archetype_id=123,
		hsreplaynet_user_id=user.id,
		rank=25,
		replay_shortid=replay.shortid,
		combined_rank="R25",
		**TEST_TWITCH_VOD_PARAMS
	)

	actual_vod = TwitchVod.get(TEST_REPLAY_META["twitch_vod"]["channel_name"], "R25")

	# Patch the TTL

	expected_vod.ttl = actual_vod.ttl

	assert expected_vod == actual_vod


@pytest.mark.django_db
@pytest.mark.usefixtures("disconnect_pre_save", "twitch_vod_dynamodb_table")
def test_record_twitch_vod_legend_rank(user, twitch_vod_game):
	deck1 = _create_deck(TEST_TWITCH_DECK_STRING_1, archetype_id=123)
	deck2 = _create_deck(TEST_TWITCH_DECK_STRING_2, archetype_id=456)

	_create_player("Test Player 1", 1, deck1, twitch_vod_game, rank=0, legend_rank=50)
	_create_player("Test Player 2", 2, deck2, twitch_vod_game, rank=0, legend_rank=49)

	replay = _create_replay(user, twitch_vod_game)

	record_twitch_vod(replay, TEST_REPLAY_META)

	expected_vod = TwitchVod(
		friendly_player_archetype_id=123,
		hsreplaynet_user_id=user.id,
		legend_rank=50,
		opposing_player_archetype_id=456,
		rank=0,
		replay_shortid=replay.shortid,
		combined_rank="L50",
		**TEST_TWITCH_VOD_PARAMS
	)
	actual_vod = TwitchVod.get(TEST_REPLAY_META["twitch_vod"]["channel_name"], "L50")

	# Patch the TTL

	expected_vod.ttl = actual_vod.ttl

	assert expected_vod == actual_vod


@pytest.mark.django_db
@pytest.mark.usefixtures("twitch_vod_dynamodb_table")
def test_record_twitch_vod_ai(user, twitch_vod_game):
	deck = _create_deck(TEST_TWITCH_DECK_STRING_1)

	_create_player("Test Player 1", 1, deck, twitch_vod_game, rank=25)
	_create_player("Test Player 2", 2, deck, twitch_vod_game, rank=-1, is_ai=True)

	replay = _create_replay(user, twitch_vod_game)

	record_twitch_vod(replay, TEST_REPLAY_META)

	expected_vod = TwitchVod(
		hsreplaynet_user_id=user.id,
		rank=25,
		replay_shortid=replay.shortid,
		combined_rank="R25",
		**TEST_TWITCH_VOD_PARAMS
	)
	actual_vod = TwitchVod.get(TEST_REPLAY_META["twitch_vod"]["channel_name"], "R25")

	# Patch the TTL

	expected_vod.ttl = actual_vod.ttl

	assert expected_vod == actual_vod


@pytest.mark.django_db
@pytest.mark.usefixtures("twitch_vod_dynamodb_table")
def test_record_twitch_vod_arena(user):
	game = GlobalGame(
		game_type=BnetGameType.BGT_ARENA,
		format=FormatType.FT_STANDARD,
		match_start=datetime(2018, 7, 15, tzinfo=pytz.utc),
		match_end=datetime(2018, 7, 15, minute=5, tzinfo=pytz.utc)
	)

	game.save()

	deck = _create_deck(TEST_TWITCH_DECK_STRING_1)

	_create_player("Test Player 1", 1, deck, game, rank=0)
	_create_player("Test Player 2", 2, deck, game, rank=0)

	replay = _create_replay(user, game)

	record_twitch_vod(replay, TEST_REPLAY_META)

	expected_vod = TwitchVod(
		hsreplaynet_user_id=user.id,
		rank=0,
		replay_shortid=replay.shortid,
		combined_rank="R0",
		**dict(TEST_TWITCH_VOD_PARAMS, game_type="BGT_ARENA")
	)
	actual_vod = TwitchVod.get(TEST_REPLAY_META["twitch_vod"]["channel_name"], "R0")

	# Patch the TTL

	expected_vod.ttl = actual_vod.ttl

	assert expected_vod == actual_vod


@pytest.mark.django_db
@pytest.mark.usefixtures("twitch_vod_dynamodb_table")
def test_record_twitch_vod_dynamodb_exception(user, twitch_vod_game):
	deck = _create_deck(TEST_TWITCH_DECK_STRING_1)

	_create_player("Test Player 1", 1, deck, twitch_vod_game, rank=25)
	_create_player("Test Player 2", 2, deck, twitch_vod_game, rank=25)

	replay = _create_replay(user, twitch_vod_game)

	def put_item_raise(*_args, **_kwargs):
		raise PutError()

	with patch.object(TableConnection, "put_item", put_item_raise):
		record_twitch_vod(replay, TEST_REPLAY_META)

		with raises(DoesNotExist):
			TwitchVod.get(TEST_REPLAY_META["twitch_vod"]["channel_name"], "R25")


def test_has_twitch_vod_url():
	assert not has_twitch_vod_url(dict())
	assert not has_twitch_vod_url(dict(twitch_vod=dict()))
	assert not has_twitch_vod_url(dict(
		twitch_vod=dict(channel_name="My Hearthstone Channel")
	))
	assert not has_twitch_vod_url(dict(
		twitch_vod=dict(
			channel_name="My Hearthstone Channel",
			url="https://not/a/twitch/url/"
		)
	))
	assert has_twitch_vod_url(TEST_REPLAY_META)


@pytest.fixture
def redis():
	r = fakeredis.FakeStrictRedis(decode_responses=True)
	yield r
	r.flushall()


@patch("hsreplaynet.games.processing.generate_globalgame_digest_v2", lambda x: "123abc")
def test_get_globalgame_digest_v2_tags(redis):
	with patch("hsreplaynet.games.processing.get_game_digests_redis", lambda: redis):
		tags = get_globalgame_digest_v2_tags(Mock())

		assert redis.hget("123abc", "count") == "1"
		assert tags == {}


@patch("hsreplaynet.games.processing.generate_globalgame_digest_v2", lambda x: "123abc")
def test_get_globalgame_digest_v2_tags_unification(redis):
	redis.hincrby("123abc", "count", 1)

	with patch("hsreplaynet.games.processing.get_game_digests_redis", lambda: redis):
		tags = get_globalgame_digest_v2_tags(Mock())

		assert redis.hget("123abc", "count") == "2"
		assert tags == {"v2_unification": True}


@patch("hsreplaynet.games.processing.generate_globalgame_digest_v2", lambda x: "123abc")
def test_get_globalgame_digest_v2_tags_collision(redis):
	redis.hincrby("123abc", "count", 2)

	with patch("hsreplaynet.games.processing.get_game_digests_redis", lambda: redis):
		tags = get_globalgame_digest_v2_tags(Mock())

		assert redis.hget("123abc", "count") == "3"
		assert tags == {
			"v2_collision": True,
			"v2_unification": True
		}
