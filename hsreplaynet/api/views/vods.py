from rest_framework import fields, serializers
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from hsreplaynet.api.permissions import UserHasFeature
from hsreplaynet.decks.models import Deck
from hsreplaynet.vods.models import TwitchVod


class VodRequestSerializer(serializers.Serializer):
	deck_id = fields.CharField()
	# In order to support archetypes here you add archetype_id, mark that and deck_id as
	# required=False and add a validate method on this serializer to ensure one is always
	# present

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


class VodSerializer(serializers.Serializer):
	"""A serializer to extract from a TwitchVod model instance"""
	channel_name = fields.CharField(source="twitch_channel_name")
	url = fields.URLField()
	rank = fields.IntegerField()
	legend_rank = fields.IntegerField(allow_null=True)
	friendly_player_archetype_id = fields.IntegerField(allow_null=True)
	opposing_player_class = fields.CharField()
	opposing_player_archetype_id = fields.IntegerField(allow_null=True)
	won = fields.BooleanField()
	went_first = fields.BooleanField()
	game_length_seconds = fields.IntegerField()


class VodListView(APIView):
	"""Query for Twitch VODs by deck id."""
	serializer_class = VodRequestSerializer
	authentication_classes = (SessionAuthentication, )
	permission_classes = (IsAuthenticated, UserHasFeature("twitch-vods"))

	def get(self, request, **kwargs):
		input = self.serializer_class(data=request.GET)
		input.is_valid(raise_exception=True)

		deck = Deck.objects.get(id=input.validated_data["deck_id"])
		deckstring = deck.deckstring

		vods = []
		for vod in TwitchVod.deck_index.query(deckstring):
			serializer = VodSerializer(instance=vod)
			vods.append(serializer.data)

		return Response(vods)
