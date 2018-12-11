from collections import defaultdict
from datetime import datetime

from django.contrib.auth import get_user_model
from hearthstone.deckstrings import parse_deckstring
from hearthstone.enums import CardClass, FormatType
from hsarchetypes import classify_deck
from rest_framework import fields, serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from hsreplaynet.api.fields import TimestampField
from hsreplaynet.api.permissions import UserHasFeature
from hsreplaynet.decks.models import Archetype, ClusterSnapshot, Deck
from hsreplaynet.vods.models import TwitchVod


ARCHETYPE_VOD_LIST_CACHE = {}
ARCHETYPE_VOD_INDEX_CACHE = {}


class VodRequestSerializer(serializers.Serializer):
	deck_id = fields.CharField(required=False)
	user_id = fields.IntegerField(required=False)
	archetype_id = fields.IntegerField(required=False)

	def validate_deck_id(self, value):
		if not value:
			return None

		try:
			if value.isdigit():
				deck = Deck.objects.get(id=value)
			else:
				deck = Deck.objects.get_by_shortid(value)
		except Deck.DoesNotExist:
			raise serializers.ValidationError("Invalid deck ID")

		if not deck.is_full_deck:
			raise serializers.ValidationError("Invalid deck ID")

		return deck.id

	def validate_user_id(self, value):
		if not value:
			return None

		User = get_user_model()

		try:
			user = User.objects.get(pk=value)
		except User.DoesNotExist:
			raise serializers.ValidationError("Invalid user ID")

		return user.id

	def validate_archetype_id(self, value):
		if not value:
			return None

		try:
			archetype = Archetype.objects.get(id=value)
		except Archetype.DoesNotExist:
			raise serializers.ValidationError("Invalid archetype ID")

		return archetype.id

	def validate(self, data):
		fields = ["user_id", "deck_id", "archetype_id"]
		field_data = [data.get(field, None) for field in fields]
		valid_fields = sum(1 for field in field_data if field)

		if valid_fields < 1:
			raise serializers.ValidationError(
				"%s must be specified." % " or ".join(fields)
			)

		if valid_fields > 1:
			raise serializers.ValidationError(
				"Too many identifiers. Only %s must be specified." % " or ".join(fields)
			)
		return data


class VodSerializer(serializers.Serializer):
	"""A serializer to extract from a TwitchVod model instance"""
	channel_name = fields.CharField(source="twitch_channel_name")
	url = fields.URLField()
	game_date = TimestampField(precision=1)
	game_type = fields.CharField()
	rank = fields.IntegerField()
	legend_rank = fields.IntegerField(allow_null=True)
	friendly_player_archetype_id = fields.IntegerField(allow_null=True)
	opposing_player_class = fields.CharField()
	opposing_player_archetype_id = fields.IntegerField(allow_null=True)
	won = fields.BooleanField()
	went_first = fields.BooleanField()
	game_length_seconds = fields.IntegerField()
	replay_shortid = fields.CharField()


def is_valid_vod(vod):
	return (vod.rank or 0) > 0 or (vod.legend_rank or 0) > 0


def verify_archetype_classification(archetype_id, vod, signature_weights):
	if not is_valid_vod(vod):
		return False
	deckstring = vod.friendly_player_canonical_deck_string
	if not deckstring:
		return False
	cards, _, _ = parse_deckstring(deckstring)
	if (sum([c[1] for c in cards])) != 30:
		return False
	dbf_map = {card[0]: card[1] for card in cards}
	new_archetype_id = classify_deck(dbf_map, signature_weights)
	return new_archetype_id == archetype_id


class VodListView(APIView):
	"""Query for Twitch VODs by deck id or user id."""
	serializer_class = VodRequestSerializer
	permission_classes = (UserHasFeature("twitch-vods"), )

	def get(self, request, **kwargs):
		input = self.serializer_class(data=request.GET)
		input.is_valid(raise_exception=True)
		vods = []

		if "deck_id" in input.validated_data:
			deck = Deck.objects.get(id=input.validated_data["deck_id"])
			deckstring = deck.deckstring

			for vod in TwitchVod.deck_index.query(deckstring):
				if not is_valid_vod(vod):
					continue
				serializer = VodSerializer(instance=vod)
				vods.append(serializer.data)
		elif "user_id" in input.validated_data:
			User = get_user_model()
			user = User.objects.get(pk=input.validated_data["user_id"])

			for vod in TwitchVod.user_id_index.query(user.id):
				if not is_valid_vod(vod):
					continue
				serializer = VodSerializer(instance=vod)
				vods.append(serializer.data)
		elif "archetype_id" in input.validated_data:
			validated_id = input.validated_data["archetype_id"]

			cached = ARCHETYPE_VOD_LIST_CACHE.get(validated_id, {})
			current_ts = datetime.utcnow().timestamp()

			if not cached or cached.get("as_of", 0) + 300 < current_ts:
				archetype = Archetype.objects.get(id=validated_id)

				signature_weights = ClusterSnapshot.objects.get_signature_weights(
					FormatType.FT_STANDARD, archetype.player_class
				)

				for vod in TwitchVod.archetype_index.query(archetype.id):
					if not verify_archetype_classification(archetype.id, vod, signature_weights):
						continue
					serializer = VodSerializer(instance=vod)
					vods.append(serializer.data)
				cached["as_of"] = current_ts
				cached["payload"] = vods
				ARCHETYPE_VOD_LIST_CACHE[archetype.id] = cached
			else:
				vods = cached["payload"]

		return Response(vods)


class VodIndexView(APIView):
	"""Query for archetype matchups with available Twitch VODs."""
	permission_classes = (UserHasFeature("twitch-vods"), )

	_signature_weights = {}

	def get_signature_weights(self, player_class):
		signature_weights = self._signature_weights.get(player_class, None)
		if not signature_weights:
			signature_weights = ClusterSnapshot.objects.get_signature_weights(
				FormatType.FT_STANDARD, player_class
			)
			self._signature_weights[player_class] = signature_weights
		return signature_weights

	def get(self, request, **kwargs):
		current_ts = datetime.utcnow().timestamp()

		if (
			not ARCHETYPE_VOD_INDEX_CACHE or
			ARCHETYPE_VOD_INDEX_CACHE.get("as_of", 0) + 300 < current_ts
		):
			archetype_map = defaultdict(list)
			for archetype in Archetype.objects.live().all():
				if archetype.player_class is CardClass.INVALID:
					continue
				signature_weights = self.get_signature_weights(archetype.player_class)
				vods = TwitchVod.archetype_index.query(archetype.id)
				for vod in vods:
					opponent_archetype = vod.opposing_player_archetype_id
					if not opponent_archetype:
						continue
					if not verify_archetype_classification(archetype.id, vod, signature_weights):
						continue
					if opponent_archetype not in archetype_map[archetype.id]:
						archetype_map[archetype.id].append(opponent_archetype)
			ARCHETYPE_VOD_INDEX_CACHE["as_of"] = current_ts
			ARCHETYPE_VOD_INDEX_CACHE["payload"] = archetype_map

		return Response(ARCHETYPE_VOD_INDEX_CACHE["payload"])
