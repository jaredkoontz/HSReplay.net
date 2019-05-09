import json

from django.core.serializers.json import DjangoJSONEncoder
from rest_framework import serializers

from hsreplaynet.api.serializers.accounts import SimpleUserSerializer

from ..decks.models import Deck
from .models import GameReplay, GlobalGame, GlobalGamePlayer


class DeckListField(serializers.ListField):
	child = serializers.CharField()


class DeckSerializer(serializers.ModelSerializer):
	cards = DeckListField(source="card_id_list", read_only=True)
	predicted_cards = DeckListField(source="predicted_card_id_list", read_only=True)
	shortid = serializers.SerializerMethodField()

	def get_shortid(self, deck: Deck):
		if not deck.is_full_deck:
			return None
		return deck.shortid

	class Meta:
		model = Deck
		fields = ("shortid", "archetype", "size", "cards", "predicted_cards")


class GameSerializer(serializers.Serializer):
	url = serializers.ReadOnlyField(source="get_absolute_url")


class PlayerSerializer(serializers.Serializer):
	rank = serializers.IntegerField(required=False, min_value=0, max_value=50, write_only=True)
	legend_rank = serializers.IntegerField(required=False, min_value=1, write_only=True)
	stars = serializers.IntegerField(required=False, write_only=True)
	wins = serializers.IntegerField(required=False, write_only=True)
	losses = serializers.IntegerField(required=False, write_only=True)
	deck = DeckListField(required=False, write_only=True)
	deck_id = serializers.IntegerField(required=False, min_value=0, write_only=True)
	cardback = serializers.IntegerField(required=False, min_value=1, write_only=True)


class TwitchVodSerializer(serializers.Serializer):
	channel_name = serializers.CharField(write_only=True)
	language = serializers.CharField(write_only=True)
	url = serializers.CharField(write_only=True)


class UploadEventSerializer(serializers.Serializer):
	id = serializers.UUIDField(read_only=True)
	shortid = serializers.CharField(read_only=True)
	status = serializers.IntegerField(read_only=True)
	tainted = serializers.BooleanField(read_only=True)
	game = GameSerializer(read_only=True)
	test_data = serializers.BooleanField(default=False)
	canary = serializers.BooleanField(default=False)

	game_type = serializers.IntegerField(default=0, write_only=True)
	format = serializers.IntegerField(required=False, write_only=True)
	build = serializers.IntegerField(write_only=True)
	match_start = serializers.DateTimeField(write_only=True)
	friendly_player = serializers.IntegerField(
		required=False, min_value=1, max_value=2, write_only=True
	)

	queue_time = serializers.IntegerField(required=False, min_value=1, write_only=True)
	spectator_mode = serializers.BooleanField(default=False, write_only=True)
	reconnecting = serializers.BooleanField(default=False, write_only=True)
	resumable = serializers.BooleanField(required=False, write_only=True)
	server_ip = serializers.IPAddressField(required=False, write_only=True)
	server_port = serializers.IntegerField(
		required=False, min_value=1, max_value=65535, write_only=True
	)
	server_version = serializers.IntegerField(required=False, min_value=1, write_only=True)
	client_handle = serializers.IntegerField(required=False, min_value=0, write_only=True)
	game_handle = serializers.IntegerField(required=False, min_value=1, write_only=True)
	aurora_password = serializers.CharField(required=False, write_only=True)
	spectator_password = serializers.CharField(required=False, write_only=True)

	scenario_id = serializers.IntegerField(required=False, min_value=0, write_only=True)
	ladder_season = serializers.IntegerField(required=False, min_value=0, write_only=True)
	brawl_season = serializers.IntegerField(required=False, min_value=0, write_only=True)

	player1 = PlayerSerializer(required=False, write_only=True)
	player2 = PlayerSerializer(required=False, write_only=True)

	twitch_vod = TwitchVodSerializer(required=False, write_only=True)

	class Meta:
		lookup_field = "shortid"

	def update(self, instance, validated_data):
		instance.metadata = json.dumps(validated_data, cls=DjangoJSONEncoder)
		instance.save()
		return instance


class GlobalGamePlayerSerializer(serializers.ModelSerializer):
	name = serializers.SerializerMethodField()
	hero_name = serializers.SerializerMethodField()
	account_hi = serializers.SerializerMethodField()
	account_lo = serializers.SerializerMethodField()
	hero_dbf_id = serializers.SerializerMethodField()

	def get_hero_dbf_id(self, instance):
		return instance.hero.dbf_id

	def get_hero_name(self, instance):
		return instance.hero.name

	def get_account_hi(self, instance):
		return instance.pegasus_account.account_hi

	def get_account_lo(self, instance):
		return instance.pegasus_account.account_lo

	def get_name(self, instance):
		if "#" in instance.name:
			return instance.name.split("#")[0]
		return instance.name

	class Meta:
		model = GlobalGamePlayer
		fields = (
			"name", "player_id", "account_hi", "account_lo", "is_ai", "is_first",
			"hero_id", "hero_premium", "final_state", "wins", "losses", "rank",
			"legend_rank", "hero_name", "hero_class_name", "hero_dbf_id"
		)


class GlobalGameSerializer(serializers.ModelSerializer):
	class Meta:
		model = GlobalGame
		fields = (
			"build", "match_start", "match_end", "game_type", "brawl_season",
			"ladder_season", "scenario_id", "num_turns", "format", "digest"
		)


class GameReplaySerializer(serializers.ModelSerializer):
	user = SimpleUserSerializer(read_only=True)
	global_game = GlobalGameSerializer(read_only=True)

	friendly_player = GlobalGamePlayerSerializer(read_only=True)
	friendly_deck = DeckSerializer(read_only=True)

	opposing_player = GlobalGamePlayerSerializer(read_only=True)
	opposing_deck = DeckSerializer(read_only=True)

	class Meta:
		model = GameReplay
		fields = (
			"shortid", "user", "global_game", "friendly_player", "friendly_deck",
			"opposing_player", "opposing_deck", "spectator_mode",
			"replay_xml", "build", "won", "disconnected", "reconnecting", "visibility"
		)
		read_only_fields = ("user", "global_game", "replay_xml")
		lookup_field = "shortid"


# Shorter serializer for list queries

class GameReplayListSerializer(GameReplaySerializer):
	class Meta:
		model = GameReplay
		fields = (
			"shortid", "spectator_mode", "build", "won", "disconnected", "reconnecting",
			"visibility", "global_game", "user", "friendly_player_id", "friendly_player",
			"opposing_player"
		)
