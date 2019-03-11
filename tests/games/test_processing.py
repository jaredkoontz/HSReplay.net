from datetime import datetime
from unittest.mock import ANY, Mock, patch

import fakeredis
import pytest
import pytz
import shortuuid
from django.db.models import signals
from django.test import override_settings
from django.utils import timezone
from djstripe.signals import on_delete_subscriber_purge_customer
from hearthstone.entities import Game, Player
from hearthstone.enums import BnetGameType, CardClass, FormatType
from moto import mock_dynamodb2
from pynamodb.connection import TableConnection
from pynamodb.exceptions import DoesNotExist, PutError
from pytest import raises
from tests.utils import create_deck_from_deckstring, create_player, create_replay

from hearthsim.identity.accounts.models import User
from hsreplaynet.decks.models import Archetype, Deck, update_deck_archetype
from hsreplaynet.games.models import GameReplay, GlobalGame
from hsreplaynet.games.processing import (
	eligible_for_unification, has_twitch_vod_url, is_partial_game, record_twitch_vod,
	should_load_into_redshift, update_last_replay_upload, update_replay_feed
)
from hsreplaynet.uploads.models import UploadEvent
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

	create_player("Test 1", 1, deck, game)
	create_player("Test 2", 2, deck, game)

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
		"language": "en",
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
	opposing_player_class="PRIEST",
	game_date=1531612800.0,
	game_length_seconds=300.0,
	game_type="BGT_RANKED_STANDARD",
	url=TEST_REPLAY_META["twitch_vod"]["url"],
	won=False,
	went_first=True,
	twitch_channel_name=TEST_REPLAY_META["twitch_vod"]["channel_name"],
	language=TEST_REPLAY_META["twitch_vod"]["language"]
)


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
	deck1 = create_deck_from_deckstring(TEST_TWITCH_DECK_STRING_1, archetype_id=123)
	deck2 = create_deck_from_deckstring(TEST_TWITCH_DECK_STRING_2)

	create_player("Test Player 1", 1, deck1, twitch_vod_game, rank=25)
	create_player("Test Player 2", 2, deck2, twitch_vod_game, rank=25)

	replay = create_replay(user, twitch_vod_game)

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
	deck1 = create_deck_from_deckstring(TEST_TWITCH_DECK_STRING_1, archetype_id=123)
	deck2 = create_deck_from_deckstring(TEST_TWITCH_DECK_STRING_2, archetype_id=456)

	create_player("Test Player 1", 1, deck1, twitch_vod_game, rank=0, legend_rank=50)
	create_player("Test Player 2", 2, deck2, twitch_vod_game, rank=0, legend_rank=49)

	replay = create_replay(user, twitch_vod_game)

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
	deck = create_deck_from_deckstring(TEST_TWITCH_DECK_STRING_1)

	create_player("Test Player 1", 1, deck, twitch_vod_game, rank=25)
	create_player("Test Player 2", 2, deck, twitch_vod_game, rank=-1, is_ai=True)

	replay = create_replay(user, twitch_vod_game)

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

	deck = create_deck_from_deckstring(TEST_TWITCH_DECK_STRING_1)

	create_player("Test Player 1", 1, deck, game, rank=0)
	create_player("Test Player 2", 2, deck, game, rank=0)

	replay = create_replay(user, game)

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
	deck = create_deck_from_deckstring(TEST_TWITCH_DECK_STRING_1)

	create_player("Test Player 1", 1, deck, twitch_vod_game, rank=25)
	create_player("Test Player 2", 2, deck, twitch_vod_game, rank=25)

	replay = create_replay(user, twitch_vod_game)

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


@pytest.mark.django_db
def test_update_last_replay_upload(user, auth_token):
	upload_event = UploadEvent(token_uuid=auth_token.key, user_agent="HDT/1.7.0")

	update_last_replay_upload(upload_event)
	user.refresh_from_db()

	assert user.last_replay_upload is not None


@pytest.mark.django_db
def test_update_last_replay_upload_non_hdt(user, auth_token):
	upload_event = UploadEvent(token_uuid=auth_token.key, user_agent="RandoTracker.com")

	update_last_replay_upload(upload_event)
	user.refresh_from_db()

	assert user.last_replay_upload is None


def test_is_partial_game():
	assert is_partial_game({"reconnecting": True})
	assert is_partial_game({"disconnected": True})
	assert not is_partial_game({"reconnecting": False, "disconnected": False})
	assert not is_partial_game({"spectator_mode": True})


def test_eligible_for_unification():
	player1 = Player(1, 1, 144115193835963207, 37760170)
	player2 = Player(2, 2, 144115193835963207, 153376707)
	innkeeper = Player(3, 1, 0, 0)

	ladder_game = Game(1)
	ladder_game.players = [player1, player2]

	ai_game = Game(2)
	ai_game.players = [innkeeper, player1]

	assert eligible_for_unification(ladder_game, {})
	assert not eligible_for_unification(ladder_game, {"reconnecting": True})
	assert not eligible_for_unification(ai_game, {})
	assert not eligible_for_unification(ai_game, {"reconnecting": True})


@pytest.mark.django_db
@pytest.mark.usefixtures("multi_db")
@override_settings(ENV_AWS=True, REDSHIFT_LOADING_ENABLED=True)
def test_should_load_into_redshift(auth_token):
	shortid = shortuuid.uuid()

	n = timezone.now()

	upload_event = UploadEvent(
		descriptor_data="{}",
		file=f"uploads/%04d/%02d/%02d/%02d/%02d/%s.power.log" % (
			n.year,
			n.month,
			n.day,
			n.hour,
			n.minute,
			shortid
		),
		shortid=shortid,
		token_uuid=auth_token.key,
		user_agent="RandoTracker.com"
	)

	upload_event.save()

	global_game = GlobalGame(
		game_type=BnetGameType.BGT_RANKED_STANDARD,
		format=FormatType.FT_STANDARD,
		match_start=n,
		match_end=n
	)

	mock_exporter = Mock()
	mock_exporter.configure_mock(is_valid_final_state=True)

	assert should_load_into_redshift(upload_event, {}, global_game, mock_exporter)


@pytest.mark.django_db
@pytest.mark.usefixtures("multi_db")
@override_settings(ENV_AWS=True, REDSHIFT_LOADING_ENABLED=True)
def test_should_load_into_redshift_false(auth_token):
	shortid = shortuuid.uuid()
	upload_event = UploadEvent(
		descriptor_data="{}",
		file=f"uploads/2018/11/20/17/44/{shortid}.power.log",
		shortid=shortid,
		token_uuid=auth_token.key,
		user_agent="RandoTracker.com"
	)

	upload_event.save()

	global_game = GlobalGame(
		game_type=BnetGameType.BGT_RANKED_STANDARD,
		format=FormatType.FT_STANDARD,
		match_start=timezone.now(),
		match_end=timezone.now()
	)

	mock_exporter = Mock()
	mock_exporter.configure_mock(is_valid_final_state=True)

	assert not should_load_into_redshift(
		upload_event,
		{"reconnecting": True},
		global_game,
		mock_exporter
	)

	mock_exporter.configure_mock(is_valid_final_state=False)
	assert not should_load_into_redshift(upload_event, {}, global_game, mock_exporter)
