import json
from datetime import datetime
from statistics import mean

from django.db import connection
from django.utils.timezone import now
from django.utils.translation import gettext as _
from django_hearthstone.cards.models import Card
from hearthstone.enums import PlayState
from rest_framework import serializers
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.mixins import (
	CreateModelMixin, ListModelMixin, RetrieveModelMixin, UpdateModelMixin
)
from rest_framework.permissions import SAFE_METHODS, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK, HTTP_201_CREATED, HTTP_400_BAD_REQUEST
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet

from hearthsim.identity.accounts.models import BlizzardAccount
from hsredshift.analytics import filters
from hsreplaynet.api.permissions import UserHasFeature
from hsreplaynet.decks.models import ArchetypeSuggestion

from ..utils.db import dictfetchall
from .models import Archetype, ArchetypeName, Deck


class ArchetypeSerializer(serializers.ModelSerializer):
	name = serializers.SerializerMethodField()
	player_class_name = serializers.SerializerMethodField()
	url = serializers.ReadOnlyField(source="get_absolute_url")

	class Meta:
		model = Archetype
		fields = (
			"id", "name", "player_class", "player_class_name", "url",
			"standard_signature", "wild_signature", "sankey_visualization"
		)

	def get_name(self, instance):
		return _(instance.name)

	def get_player_class_name(self, instance):
		return instance.player_class.name


class ArchetypeListSerializer(ArchetypeSerializer):
	name = serializers.SerializerMethodField()
	player_class_name = serializers.SerializerMethodField()
	standard_ccp_signature_core = serializers.SerializerMethodField()
	wild_ccp_signature_core = serializers.SerializerMethodField()
	url = serializers.ReadOnlyField(source="get_absolute_url")

	class Meta:
		model = Archetype
		fields = (
			"id", "name", "player_class", "player_class_name", "url",
			"standard_ccp_signature_core", "wild_ccp_signature_core"
		)

	def get_name(self, instance):
		return _(instance.name)

	def get_player_class_name(self, instance):
		return instance.player_class.name

	def get_standard_ccp_signature_core(self, instance):
		return self.core_signature(instance.standard_ccp_signature)

	def get_wild_ccp_signature_core(self, instance):
		return self.core_signature(instance.wild_ccp_signature)

	def core_signature(self, signature):
		if signature:
			components = sorted(signature["components"], key=lambda x: x[1], reverse=True)
			signature["components"] = [dbf for dbf, weight in components][:10]
			return signature

	def to_representation(self, instance):
		from django.core.cache import caches
		from django.core.serializers.json import DjangoJSONEncoder

		cache = caches["redshift"]
		lang = self.context["request"].LANGUAGE_CODE
		key = f"ArchetypeListSerializer::{instance.pk}::{lang}"
		cached = cache.get(key)
		if cached:
			return cached

		ret = super().to_representation(instance)
		ret = json.loads(json.dumps(ret, cls=DjangoJSONEncoder))
		# cache.set(key, ret, 600)
		return ret


class ArchetypeWriteSerializer(serializers.ModelSerializer):
	class Meta:
		model = Archetype
		fields = ("id", "name", "player_class")


class DeckCreationSerializer(serializers.Serializer):
	shortid = serializers.CharField(read_only=True)
	format = serializers.IntegerField(min_value=0)
	heroes = serializers.ListField(
		child=serializers.IntegerField(min_value=1),
		min_length=0, max_length=1
	)
	cards = serializers.ListField(
		child=serializers.IntegerField(min_value=1),
		min_length=30, max_length=30
	)
	archetype_id = serializers.IntegerField(read_only=True)

	def save(self):
		self.validated_data["cards"].sort()
		card_ids = [Card.get_string_id(id) for id in self.validated_data["cards"]]
		deck, created = Deck.objects.get_or_create_from_id_list(
			card_ids, classify_archetype=True
		)
		self.validated_data["shortid"] = deck.shortid
		self.validated_data["archetype_id"] = deck.archetype_id
		return created


class DeckSerializer(serializers.ModelSerializer):
	archetype = serializers.PrimaryKeyRelatedField(
		queryset=Archetype.objects.live().all(),
		allow_null=True
	)
	digest = serializers.CharField(read_only=True)
	shortid = serializers.CharField(read_only=True)
	cards = serializers.SerializerMethodField(read_only=True)

	class Meta:
		model = Deck
		fields = ("id", "archetype", "shortid", "cards", "digest")

	def get_cards(self, value):
		return value.cards.values_list("dbf_id", flat=True)

	def update(self, instance, validated_data):
		old_archetype = instance.archetype
		new_archetype = validated_data["archetype"]
		result = super(DeckSerializer, self).update(instance, validated_data)

		if old_archetype != new_archetype:
			instance.sync_archetype_to_firehose()

		return result


class GetOrCreateDeckView(APIView):
	authentication_classes = ()
	permission_classes = ()
	serializer_class = DeckCreationSerializer

	def post(self, request, format=None):
		serializer = self.serializer_class(data=request.data)
		if serializer.is_valid():
			created = serializer.save()
			if created:
				status = HTTP_201_CREATED
			else:
				status = HTTP_200_OK
			return Response(serializer.data, status=status)
		return Response(serializer.errors, status=HTTP_400_BAD_REQUEST)

	def get_view_name(self):
		return "Deck List"


class DeckDetailView(RetrieveUpdateAPIView):
	authentication_classes = (SessionAuthentication, )
	permission_classes = (IsAdminUser, )
	queryset = Deck.objects.all()
	serializer_class = DeckSerializer

	def get_object(self):
		try:
			return self.queryset.model.objects.get_by_shortid(self.kwargs["shortid"])
		except Deck.DoesNotExist:
			raise NotFound()


class DeckFeedbackSerializer(serializers.Serializer):
	name = serializers.CharField(allow_blank=False, trim_whitespace=True)
	as_of = serializers.DateTimeField(read_only=True)
	suggestions = serializers.SerializerMethodField()

	def create(self, validated_data):
		deck = validated_data["deck"]
		user = validated_data["user"]
		name, created = ArchetypeName.objects.get_or_create(
			name=validated_data["name"],
			player_class=validated_data["deck"].deck_class,
			defaults={
				"contributing_user": user
			}
		)
		return ArchetypeSuggestion.objects.create(
			suggested_name=name,
			user=user,
			deck=deck
		)

	def update(self, instance, validated_data):
		name, created = ArchetypeName.objects.get_or_create(
			name=validated_data["name"],
			player_class=validated_data["deck"].deck_class,
			defaults={
				"contributing_user": validated_data["user"]
			}
		)
		instance.suggested_name = name
		instance.as_of = datetime.now()
		instance.save()
		return instance

	def get_suggestions(self, obj):
		return self.context.get("suggestions", [])

	def get_initial(self):
		return {
			"name": None,
			"as_of": None,
			"suggestions": self.get_suggestions(None)
		}

	def to_representation(self, instance):
		return {
			"name": instance.suggested_name.name,
			"as_of": instance.as_of,
			"suggestions": self.get_suggestions(instance)
		}


class DeckFeedbackView(APIView):
	authentication_classes = (SessionAuthentication, )
	permission_classes = (IsAuthenticated, UserHasFeature("archetype-naming"))
	serializer_class = DeckFeedbackSerializer

	def _get_deck(self, shortid):
		try:
			return Deck.objects.get_by_shortid(shortid=shortid)
		except Deck.DoesNotExist:
			raise NotFound(detail="Deck does not exist.")

	def _get_suggestions(self, deck):
		suggestions = ArchetypeName.objects.get_suggestions_for_deck(deck)
		return [name.name for name in suggestions]

	def get(self, request, format=None, *args, **kwargs):
		deck = self._get_deck(kwargs["shortid"])

		suggestion = None
		try:
			suggestion = ArchetypeSuggestion.objects.get(deck=deck, user=request.user)
		except ArchetypeSuggestion.DoesNotExist:
			pass

		serializer = self.serializer_class(instance=suggestion, context={
			"suggestions": self._get_suggestions(deck)
		})
		return Response(serializer.data, status=HTTP_200_OK)

	def post(self, request, format=None, *args, **kwargs):
		deck = self._get_deck(kwargs["shortid"])

		suggestion = None
		try:
			suggestion = ArchetypeSuggestion.objects.get(deck=deck, user=request.user)
		except ArchetypeSuggestion.DoesNotExist:
			pass

		serializer = self.serializer_class(instance=suggestion, data=request.data)

		if serializer.is_valid():
			serializer.save(user=request.user, deck=deck)
			serializer.context["suggestions"] = self._get_suggestions(deck)
			status = HTTP_200_OK if suggestion is not None else HTTP_201_CREATED
			return Response(serializer.data, status=status)
		return Response(serializer.errors, status=HTTP_400_BAD_REQUEST)

	def delete(self, request, format=None, *args, **kwargs):
		deck = self._get_deck(kwargs["shortid"])

		try:
			suggestion = ArchetypeSuggestion.objects.get(deck=deck, user=request.user)
			suggestion.delete()
		except ArchetypeSuggestion.DoesNotExist:
			pass

		serializer = self.serializer_class(context={
			"suggestions": self._get_suggestions(deck)
		})
		return Response(serializer.data, status=HTTP_200_OK)


class ArchetypeViewSet(
	CreateModelMixin, ListModelMixin, RetrieveModelMixin, UpdateModelMixin, GenericViewSet
):
	authentication_classes = (SessionAuthentication, )
	pagination_class = None
	queryset = Archetype.objects.live().all()

	def get_serializer_class(self):
		if self.request.method in ["PATCH", "POST"]:
			return ArchetypeWriteSerializer
		if self.action == "list":
			return ArchetypeListSerializer
		return ArchetypeSerializer

	def get_permission_classes(self):
		if self.request.method in SAFE_METHODS:
			return ()
		return (UserHasFeature("archetype-training"), )


class MyDecksAPIView(APIView):
	authentication_classes = (SessionAuthentication, )
	permission_classes = (IsAuthenticated, )

	def _get_filter(self, filter_name, filter_cls):
		filter_value = self.request.GET.get(filter_name, "")
		if filter_value not in filter_cls.__members__:
			raise ValidationError({filter_name: "Invalid value: %r" % (filter_value)})

		return filter_cls[filter_value]

	def _get_time_range(self):
		filter_cls = filters.TimeRange
		time_range = self._get_filter("TimeRange", filter_cls)
		start_of_this_season = "date_trunc('month', now())"
		start_of_previous_season = "date_trunc('month', now()) - interval '1 month'"

		if time_range == filter_cls.LAST_30_DAYS:
			return ("now() - interval '30 days'", "now()")
		elif time_range == filter_cls.CURRENT_SEASON:
			return (start_of_this_season, "now()")
		elif time_range == filter_cls.PREVIOUS_SEASON:
			return (start_of_previous_season, start_of_this_season)
		else:
			raise ValidationError({"TimeRange": "Unsupported value: %r" % (time_range.name)})

	def _get_int_filter(self, filter_name):
		param = self.request.GET.get(filter_name)
		if not param or not param.isdigit():
			raise ValidationError({filter_name: "Required parameter must be a digit."})
		return int(param)

	def get(self, request, format=None):
		region = self._get_int_filter("Region")
		account_lo = self._get_int_filter("account_lo")
		as_of = now()

		try:
			blizzard_account = BlizzardAccount.objects.get(
				region=region, account_lo=account_lo, user=request.user
			)
		except BlizzardAccount.DoesNotExist:
			raise NotFound()

		game_type = self._get_filter("GameType", filters.GameType).value[0]
		time_start, time_end = self._get_time_range()

		query = """
		SELECT
			(gg.match_end - gg.match_start)::interval as "duration",
			gg.match_start as "match_start",
			gg.num_turns as "num_turns",
			ggp.deck_list_id as "deck_list_id",
			ggp.final_state as "final_state",
			ggp.is_first as "is_first",
			ggp.rank as "rank",
			ggp.legend_rank as "legend_rank",
			ggp.stars as "stars",
			ggp.hero_id as "hero_card_id",
			c.dbf_id as "hero_dbf_id",
			c.card_class as "card_class"
		FROM
			games_globalgameplayer ggp
		JOIN
			games_globalgame gg on gg.id = ggp.game_id
		JOIN
			card c on ggp.hero_id = c.card_id
		WHERE
			ggp.pegasus_account_id = %%s AND
			gg.game_type = %%s AND
			gg.match_start >= %s AND
			gg.match_start < %s
		""" % (time_start, time_end)  # time_start / time_end are safe (not user input)

		with connection.cursor() as cursor:
			cursor.execute(query, [blizzard_account.id, game_type])
			data = dictfetchall(cursor)

		data_by_deck = {}
		deck_ids = set(row["deck_list_id"] for row in data)
		decks_played = {
			deck.id: deck for deck in Deck.objects.filter(id__in=deck_ids, size=30)
		}

		for row in data:
			if row["deck_list_id"] not in decks_played:
				# Most likely a deck with <30 cards
				continue

			if row["deck_list_id"] not in data_by_deck:
				data_by_deck[row["deck_list_id"]] = {
					"player_class": row["card_class"],
					"game_dates": [],
					"player_turns": [],
					"game_duration": [],
					"games_won": 0,
					"actual_deck": decks_played[row["deck_list_id"]],
				}

			data_by_deck[row["deck_list_id"]]["player_turns"].append(row["num_turns"])
			data_by_deck[row["deck_list_id"]]["game_duration"].append(row["duration"].seconds)
			data_by_deck[row["deck_list_id"]]["game_dates"].append(row["match_start"])

			if row["final_state"] == PlayState.WON:
				data_by_deck[row["deck_list_id"]]["games_won"] += 1

		final_series = {}

		for row in data_by_deck.values():
			total_games = len(row["game_dates"])
			final_series[row["actual_deck"].shortid] = {
				"player_class": row["player_class"],
				"total_games": total_games,
				"last_played": max(row["game_dates"]),
				"win_rate": (row["games_won"] / total_games) * 100.0,
				"avg_game_length_seconds": mean(row["game_duration"]),
				"avg_num_player_turns": mean(row["player_turns"]),
				"deck_list": row["actual_deck"].card_dbf_id_packed_list,
			}

		ret = {
			"render_as": "table",
			"series": {"data": final_series},
			"as_of": as_of,
		}

		return Response(ret)
