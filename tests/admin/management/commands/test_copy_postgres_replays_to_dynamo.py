from datetime import datetime

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from hearthstone.enums import BnetGameType, FormatType
from tests.utils import create_deck_from_deckstring, create_player, create_replay

from hsreplaynet.admin.management.commands.copy_postgres_replays_to_dynamo import Command
from hsreplaynet.games.models import GlobalGame
from hsreplaynet.games.models.dynamodb import GameReplay as DynamoDBGameReplay


@pytest.mark.django_db
@pytest.mark.usefixtures("game_replay_dynamodb_table")
def test_command(user):
	global_game = GlobalGame.objects.create(
		id=1,
		format=FormatType.FT_STANDARD,
		game_type=BnetGameType.BGT_RANKED_STANDARD,
		match_start=datetime.now(),
		match_end=datetime.now(),
		num_turns=5,
	)
	friendly_deckstring = (
		"AAECAZICApnTAvX8Ag5AX/0C5gXkCJvLAqDNAofOAo7QApjSAp7SAtvTAtfvAuL4AgA="
	)
	friendly_player_deck = create_deck_from_deckstring(friendly_deckstring)
	friendly_player = create_player(
		name="FriendlyPlayer#1234",
		id=1,
		deck=friendly_player_deck,
		game=global_game,
		rank=3
	)
	opposing_deckstring = (
		"AAECAR8I+AjtCdPFAobTApziArbqAsvsAoDzAguNAZcIq8IC2MICnM0C3dICi+EC4eMC8vECufgC4vgCAA=="
	)
	opposing_player_deck = create_deck_from_deckstring(opposing_deckstring)
	opponent = create_player(
		name="OpposingPlayer#1234",
		id=2,
		deck=opposing_player_deck,
		game=global_game,
		rank=3
	)
	game = create_replay(user=user, game=global_game, friendly_player_id=1)
	game.replay_xml = SimpleUploadedFile("/replays/replay.xml", b"<replay/>")
	game.save()

	Command().handle(username=[user.username], continue_on_error=False)

	dynamo_replays = list(DynamoDBGameReplay.query(user.id))
	assert len(dynamo_replays) == 1

	dynamo_replay = dynamo_replays[0]

	assert dynamo_replay.user_id == int(game.user.id)

	match_start = int(global_game.match_start.timestamp() * 1000)
	match_end = int(global_game.match_end.timestamp() * 1000)

	assert dynamo_replay.match_start == match_start
	assert dynamo_replay.match_end == match_end

	assert dynamo_replay.short_id == game.shortid
	assert dynamo_replay.digest == global_game.digest

	assert dynamo_replay.game_type == global_game.game_type
	assert dynamo_replay.format_type == FormatType.FT_STANDARD

	assert dynamo_replay.game_type_match_start == "{}:{}". format(
		int(global_game.game_type),
		match_start
	)

	assert dynamo_replay.ladder_season == global_game.ladder_season
	assert dynamo_replay.brawl_season == global_game.brawl_season
	assert dynamo_replay.scenario_id == global_game.scenario_id
	assert dynamo_replay.num_turns == global_game.num_turns

	assert dynamo_replay.friendly_player_account_hilo == "{}_{}".format(
		friendly_player.pegasus_account.account_hi,
		friendly_player.pegasus_account.account_lo,
	)
	assert dynamo_replay.friendly_player_battletag == friendly_player.name
	assert dynamo_replay.friendly_player_is_first == friendly_player.is_first
	assert dynamo_replay.friendly_player_rank == friendly_player.rank
	assert dynamo_replay.friendly_player_legend_rank == friendly_player.legend_rank
	assert dynamo_replay.friendly_player_rank_stars == friendly_player.stars
	assert dynamo_replay.friendly_player_wins == friendly_player.wins
	assert dynamo_replay.friendly_player_losses == friendly_player.losses
	assert dynamo_replay.friendly_player_class == friendly_player.hero.card_class
	assert dynamo_replay.friendly_player_hero == friendly_player.hero.dbf_id
	assert len(dynamo_replay.friendly_player_deck)
	assert dynamo_replay.friendly_player_blizzard_deck_id == friendly_player.deck_id
	assert dynamo_replay.friendly_player_cardback_id == friendly_player.cardback_id
	assert dynamo_replay.friendly_player_final_state == friendly_player.final_state

	assert dynamo_replay.opponent_account_hilo == "{}_{}".format(
		opponent.pegasus_account.account_hi,
		opponent.pegasus_account.account_lo,
	)
	assert dynamo_replay.opponent_battletag == opponent.name
	assert dynamo_replay.opponent_is_ai == opponent.is_ai
	assert dynamo_replay.opponent_rank == opponent.rank
	assert dynamo_replay.opponent_legend_rank == opponent.legend_rank
	assert dynamo_replay.opponent_class == opponent.hero.card_class
	assert dynamo_replay.opponent_hero == opponent.hero.dbf_id
	assert len(dynamo_replay.opponent_revealed_deck)
	assert len(dynamo_replay.opponent_predicted_deck)
	assert dynamo_replay.opponent_cardback_id == opponent.cardback_id
	assert dynamo_replay.opponent_final_state == opponent.final_state

	assert dynamo_replay.replay_xml == game.replay_xml.name
	assert dynamo_replay.disconnected == game.disconnected
	assert dynamo_replay.reconnecting == game.reconnecting
	assert dynamo_replay.hslog_version == game.hslog_version or "0.0"
	assert dynamo_replay.visibility == game.visibility
	assert dynamo_replay.views == int(game.views)
