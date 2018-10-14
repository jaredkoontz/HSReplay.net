from hearthstone import enums
from hearthstone.deckstrings import parse_deckstring
from hsarchetypes import classify_deck
from rest_framework import fields, serializers

from hearthsim.identity.accounts.models import Visibility
from hsreplaynet.decks.models import ClusterSnapshot

from ..fields import IntEnumField, TimestampField


class GameReplaySerializer(serializers.Serializer):
	user_id = fields.IntegerField()
	match_start = TimestampField(precision=1000)
	match_end = TimestampField(precision=1000)

	shortid = fields.CharField(source="short_id")
	digest = fields.CharField(allow_null=True)

	game_type = IntEnumField(enums.BnetGameType)
	format_type = IntEnumField(enums.FormatType)

	ladder_season = fields.IntegerField(allow_null=True)
	brawl_season = fields.IntegerField(allow_null=True)
	scenario_id = fields.IntegerField(allow_null=True)
	num_turns = fields.IntegerField()

	friendly_player_account_hi = fields.SerializerMethodField()
	friendly_player_account_lo = fields.SerializerMethodField()

	friendly_player_archetype_id = fields.SerializerMethodField(allow_null=True)

	friendly_player_battletag = fields.CharField()
	friendly_player_is_first = fields.BooleanField()
	friendly_player_rank = fields.IntegerField(allow_null=True)
	friendly_player_legend_rank = fields.IntegerField(allow_null=True)
	friendly_player_rank_stars = fields.IntegerField(allow_null=True)
	friendly_player_wins = fields.IntegerField(allow_null=True)
	friendly_player_losses = fields.IntegerField(allow_null=True)
	friendly_player_class = IntEnumField(enums.CardClass)
	friendly_player_hero = fields.IntegerField()
	friendly_player_deck = fields.CharField()
	friendly_player_blizzard_deck_id = fields.IntegerField(allow_null=True)
	friendly_player_cardback_id = fields.IntegerField(allow_null=True)
	friendly_player_final_state = IntEnumField(enums.PlayState)

	opponent_account_hi = fields.SerializerMethodField()
	opponent_account_lo = fields.SerializerMethodField()

	opponent_archetype_id = fields.SerializerMethodField(allow_null=True)

	opponent_battletag = fields.CharField()
	opponent_is_ai = fields.BooleanField()
	opponent_rank = fields.IntegerField(allow_null=True)
	opponent_legend_rank = fields.IntegerField(allow_null=True)
	opponent_class = IntEnumField(enums.CardClass)
	opponent_hero = fields.IntegerField()
	opponent_revealed_deck = fields.CharField()
	opponent_predicted_deck = fields.CharField(allow_null=True)
	opponent_cardback_id = fields.IntegerField(allow_null=True)
	opponent_final_state = IntEnumField(enums.PlayState)

	replay_xml = fields.CharField()
	hslog_version = fields.CharField()
	disconnected = fields.BooleanField(default=False)
	reconnecting = fields.BooleanField(default=False)
	visibility = IntEnumField(Visibility)
	views = fields.IntegerField()

	def _classify_deck(self, format_type, player_class, deckstring):
		if not deckstring:
			return None
		cards, _, _ = parse_deckstring(deckstring)
		if (sum([c[1] for c in cards])) != 30:
			return None
		signature_weights = ClusterSnapshot.objects.get_signature_weights(
			format_type, player_class
		)
		dbf_map = {card[0]: card[1] for card in cards}
		return classify_deck(dbf_map, signature_weights)

	def get_friendly_player_account_hi(self, instance):
		return instance.friendly_player_account_hilo.split("_")[0]

	def get_friendly_player_account_lo(self, instance):
		return instance.friendly_player_account_hilo.split("_")[1]

	def get_friendly_player_archetype_id(self, instance):
		return self._classify_deck(
			instance.format_type,
			instance.friendly_player_class,
			instance.friendly_player_deck
		)

	def get_opponent_account_hi(self, instance):
		return instance.opponent_account_hilo.split("_")[0]

	def get_opponent_account_lo(self, instance):
		return instance.opponent_account_hilo.split("_")[1]

	def get_opponent_archetype_id(self, instance):
		return self._classify_deck(
			instance.format_type,
			instance.opponent_class,
			instance.opponent_predicted_deck
		)
