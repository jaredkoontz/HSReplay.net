from django.conf import settings
from hearthstone import enums
from pynamodb.attributes import BooleanAttribute, NumberAttribute, UnicodeAttribute
from pynamodb.indexes import GlobalSecondaryIndex, KeysOnlyProjection
from pynamodb.models import Model

from hearthsim.identity.accounts.models import Visibility
from hsreplaynet.utils.dynamodb import IntEnumAttribute


class GameReplayGameTypeIndex(GlobalSecondaryIndex):
	user_id = NumberAttribute(hash_key=True)
	game_type_match_start = UnicodeAttribute(range_key=True)

	class Meta:
		index_name = "by_game_type"
		projection = KeysOnlyProjection()
		read_capacity_units = 16
		write_capacity_units = 40


class GameReplayShortIdIndex(GlobalSecondaryIndex):
	short_id = UnicodeAttribute(hash_key=True)

	class Meta:
		index_name = "by_short_id"
		projection = KeysOnlyProjection()
		read_capacity_units = 16
		write_capacity_units = 40


class GameReplay(Model):
	user_id = NumberAttribute(hash_key=True)
	match_start = NumberAttribute(range_key=True)
	match_end = NumberAttribute()

	short_id = UnicodeAttribute()
	digest = UnicodeAttribute(null=True)

	game_type = IntEnumAttribute(enums.BnetGameType)
	format_type = IntEnumAttribute(enums.FormatType)

	game_type_match_start = UnicodeAttribute()  # [game_type]:[match_start]

	ladder_season = NumberAttribute(null=True)
	brawl_season = NumberAttribute(null=True)
	scenario_id = NumberAttribute(null=True)
	num_turns = NumberAttribute()

	friendly_player_account_hilo = UnicodeAttribute()  # [hi]_[lo]
	friendly_player_battletag = UnicodeAttribute()
	friendly_player_is_first = BooleanAttribute()
	friendly_player_rank = NumberAttribute(null=True)
	friendly_player_legend_rank = NumberAttribute(null=True)
	friendly_player_rank_stars = NumberAttribute(null=True)
	friendly_player_wins = NumberAttribute(null=True)
	friendly_player_losses = NumberAttribute(null=True)
	friendly_player_class = IntEnumAttribute(enums.CardClass)
	friendly_player_hero = NumberAttribute()
	friendly_player_deck = UnicodeAttribute()  # deckstring
	friendly_player_blizzard_deck_id = NumberAttribute(null=True)
	friendly_player_cardback_id = NumberAttribute(null=True)
	friendly_player_final_state = IntEnumAttribute(enums.PlayState)

	opponent_account_hilo = UnicodeAttribute()  # [hi]_[lo]
	opponent_battletag = UnicodeAttribute()
	opponent_is_ai = BooleanAttribute()
	opponent_rank = NumberAttribute(null=True)
	opponent_legend_rank = NumberAttribute(null=True)
	opponent_class = IntEnumAttribute(enums.CardClass)
	opponent_hero = NumberAttribute()
	opponent_revealed_deck = UnicodeAttribute()  # deckstring
	opponent_predicted_deck = UnicodeAttribute(null=True)  # deckstring
	opponent_cardback_id = NumberAttribute(null=True)
	opponent_final_state = IntEnumAttribute(enums.PlayState)

	replay_xml = UnicodeAttribute()
	disconnected = BooleanAttribute(default=False)
	reconnecting = BooleanAttribute(default=False)
	hslog_version = UnicodeAttribute()
	visibility = IntEnumAttribute(Visibility)
	views = NumberAttribute()

	game_type_index = GameReplayGameTypeIndex()
	short_id_index = GameReplayShortIdIndex()

	class Meta:
		table_name = settings.DYNAMODB_TABLES["game_replay"]["NAME"]
		host = settings.DYNAMODB_TABLES["game_replay"]["HOST"]
		if hasattr(settings, "AWS_CREDENTIALS"):
			aws_access_key_id = settings.AWS_CREDENTIALS["AWS_ACCESS_KEY_ID"]
			aws_secret_access_key = settings.AWS_CREDENTIALS["AWS_SECRET_ACCESS_KEY"]
		read_capacity_units = 16
		write_capacity_units = 40
