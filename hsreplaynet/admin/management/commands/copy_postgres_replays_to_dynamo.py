import time

from django.core.management.base import BaseCommand
from hearthstone.deckstrings import write_deckstring
from pynamodb.exceptions import PynamoDBException

from hsreplaynet.games.models import GameReplay
from hsreplaynet.games.models.dynamodb import GameReplay as DynamoDBGameReplay


class Command(BaseCommand):
	def add_arguments(self, parser):
		parser.add_argument(
			"--username",
			nargs=1,
			help="Name of target user"
		)
		parser.add_argument(
			"--continue-on-error",
			default=False,
			action="store_true",
			help="Continue with remaining replays when one errors"
		)

	def handle(self, *args, **options):
		username = options["username"][0]
		games = GameReplay.objects.all().filter(
			user__username=username
		)

		if not games:
			raise Exception("No games found for %s" % username)

		num_games = len(games)
		errored_games = []

		for index, game in enumerate(games):
			print("Game %s/%s: %s" % (index + 1, num_games, game.global_game.id))
			try:
				self._save_to_dynamo(game)
			except PynamoDBException:
				time.sleep(10)
				self._save_to_dynamo(game)
			except Exception as e:
				if options["continue_on_error"]:
					print(e)
					errored_games.append(game)
				else:
					raise e
			if index % 5 == 0:
				time.sleep(1)

		if errored_games:
			print("The following games could not be copied successfully:")
			print(", ".join(str(g.global_game.id) for g in errored_games))

	def _save_to_dynamo(self, game):
		friendly_player = game.friendly_player
		opponent = game.opposing_player

		format_type = game.global_game.format

		friendly_player_deck = write_deckstring(
			friendly_player.deck_list.card_dbf_id_packed_list if friendly_player.deck_list else [],
			[friendly_player.hero.dbf_id],
			format_type,
		)

		opponent_revealed_cards = game.opponent_revealed_deck.card_dbf_id_packed_list if (
			game.opponent_revealed_deck
		) else []
		opponent_revealed_deck = write_deckstring(
			opponent_revealed_cards,
			[opponent.hero.dbf_id],
			format_type,
		)

		opponent_predicted_deck = write_deckstring(
			game.opponent_revealed_deck.guessed_full_deck.card_dbf_id_packed_list if (
				game.opponent_revealed_deck and game.opponent_revealed_deck.guessed_full_deck
			) else [],
			[opponent.hero.dbf_id],
			format_type,
		)

		match_start = int(game.global_game.match_start.timestamp() * 1000)
		match_end = int(game.global_game.match_end.timestamp() * 1000)

		dynamo_replay = DynamoDBGameReplay(
			user_id=int(game.user.id),
			match_start=match_start,
			match_end=match_end,

			short_id=game.shortid,
			digest=game.global_game.digest,

			game_type=game.global_game.game_type,
			format_type=format_type,

			game_type_match_start="{}:{}".format(
				int(game.global_game.game_type),
				match_start
			),

			ladder_season=game.global_game.ladder_season,
			brawl_season=game.global_game.brawl_season,
			scenario_id=game.global_game.scenario_id,
			num_turns=game.global_game.num_turns,

			friendly_player_account_hilo="{}_{}".format(
				friendly_player.pegasus_account.account_hi,
				friendly_player.pegasus_account.account_lo,
			),
			friendly_player_battletag=friendly_player.name,
			friendly_player_is_first=friendly_player.is_first,
			friendly_player_rank=friendly_player.rank,
			friendly_player_legend_rank=friendly_player.legend_rank,
			friendly_player_rank_stars=friendly_player.stars,
			friendly_player_wins=friendly_player.wins,
			friendly_player_losses=friendly_player.losses,
			friendly_player_class=friendly_player.hero.card_class,
			friendly_player_hero=friendly_player.hero.dbf_id,
			friendly_player_deck=friendly_player_deck,
			friendly_player_blizzard_deck_id=friendly_player.deck_id,
			friendly_player_cardback_id=friendly_player.cardback_id,
			friendly_player_final_state=friendly_player.final_state,

			opponent_account_hilo="{}_{}".format(
				opponent.pegasus_account.account_hi,
				opponent.pegasus_account.account_lo,
			),
			opponent_battletag=opponent.name,
			opponent_is_ai=opponent.is_ai,
			opponent_rank=opponent.rank,
			opponent_legend_rank=opponent.legend_rank,
			opponent_class=opponent.hero.card_class,
			opponent_hero=opponent.hero.dbf_id,
			opponent_revealed_deck=opponent_revealed_deck,
			opponent_predicted_deck=opponent_predicted_deck,
			opponent_cardback_id=opponent.cardback_id,
			opponent_final_state=opponent.final_state,

			replay_xml=game.replay_xml.name,
			disconnected=game.disconnected,
			reconnecting=game.reconnecting,
			hslog_version=game.hslog_version or "0.0",
			visibility=game.visibility,
			views=int(game.views),
		)
		dynamo_replay.save()
