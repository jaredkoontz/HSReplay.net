import json
from collections import OrderedDict
from itertools import chain

from hearthstone import enums
from hearthstone.enums import CardSet
from rest_framework.serializers import Serializer, SerializerMethodField

from hsreplaynet.decks.models import Archetype


GAME_TYPES = {
	"RANKED_STANDARD": 2,
	"ARENA": 3,
	"RANKED_WILD": 30,
}


class InvalidCardException(Exception):
	pass


class CardDataDeckSerializer(Serializer):
	name = SerializerMethodField()
	player_class = SerializerMethodField()
	url = SerializerMethodField()
	winrate = SerializerMethodField()

	_archetype = None

	def _get_archetype(self, instance):
		if self._archetype:
			return self._archetype
		self._archetype = Archetype.objects.live().filter(
			id=instance["archetype_id"]
		).first()
		return self._archetype

	def get_name(self, instance):
		return {
			"enUS": self._get_archetype(instance).name
		}

	def get_player_class(self, instance):
		return self._get_archetype(instance).player_class.name

	def get_url(self, instance):
		return "https://hsreplay.net/decks/%s/" % instance["deck_id"]

	def get_winrate(self, instance):
		return instance["win_rate"]


class CardDataSerializer(Serializer):
	url = SerializerMethodField()
	popularity = SerializerMethodField()
	deck_winrate = SerializerMethodField()
	top_decks = SerializerMethodField()

	NUM_TOP_DECKS = 3
	CONSTRUCTED_GAME_TYPES = ["RANKED_STANDARD", "RANKED_WILD"]
	_card_data = None

	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		self._deck_data = kwargs["context"]["deck_data"]
		self._popularity_data = kwargs["context"]["popularity_data"]

	def _get_card_data(self, instance):
		if self._card_data is not None:
			return self._card_data
		for data in self._popularity_data:
			if data["dbf_id"] == instance["card"].dbf_id:
				self._card_data = data
				return data
		self._card_data = {}
		return self._card_data

	def get_url(self, instance):
		return "https://hsreplay.net%s#gameType=%s" % (
			instance["card"].get_absolute_url(),
			instance["game_type"]
		)

	def get_popularity(self, instance):
		return self._get_card_data(instance).get("popularity")

	def get_deck_winrate(self, instance):
		return self._get_card_data(instance).get("winrate")

	def get_top_decks(self, instance):
		if (
			instance["game_type"] not in self.CONSTRUCTED_GAME_TYPES or
			not self._deck_data or
			not self._get_card_data(instance) or
			instance["card"].dbf_id not in self._deck_data
		):
			return []

		decks = sorted(
			self._deck_data[instance["card"].dbf_id].values(),
			key=lambda x: x["win_rate"],
			reverse=True
		)[:self.NUM_TOP_DECKS]

		return [CardDataDeckSerializer(deck).data for deck in decks]

	def to_representation(self, instance):
		ret = super().to_representation(instance)
		return OrderedDict([(key, ret[key]) for key in ret if ret[key] is not None])


class CardSerializer(Serializer):
	card_id = SerializerMethodField()
	dbf_id = SerializerMethodField()
	game_types = SerializerMethodField()
	is_standard = SerializerMethodField()

	# Generates a map of dbf_id -> archetype_id -> deck with best winrate

	def _explode_by_card(self, decks_by_class):
		cards = dict()

		for deck in chain(*decks_by_class.values()):
			archetype_id = deck["archetype_id"]

			if archetype_id <= 0:
				continue

			for card_count in json.loads(deck["deck_list"]):
				deck_card_dbf_id = card_count[0]
				if deck_card_dbf_id not in cards:
					cards[deck_card_dbf_id] = dict()

				best_deck = cards[deck_card_dbf_id].get(archetype_id)

				if not best_deck or best_deck["win_rate"] < deck["win_rate"]:
					cards[deck_card_dbf_id][archetype_id] = deck

		return cards

	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)

		self._context = dict()

		data_by_game_type = kwargs["context"]["game_type_data"]
		for game_type in data_by_game_type.keys():
			src_data = data_by_game_type[game_type]
			deck_data = src_data["deck_data"]

			exploded_deck_data = self._explode_by_card(deck_data) \
				if deck_data else None

			self._context[game_type] = dict(
				deck_data=exploded_deck_data,
				popularity_data=src_data["popularity_data"]
			)

	def to_representation(self, instance):
		try:
			return super().to_representation(instance)
		except InvalidCardException:
			return {}

	def get_card_id(self, instance):
		return instance.id

	def get_dbf_id(self, instance):
		return instance.dbf_id

	def get_game_types(self, instance):
		result = dict()
		for game_type in self._context.keys():
			data = dict(
				card=instance,
				game_type=game_type
			)
			serializer = CardDataSerializer(data, context=self._context[game_type])
			data = serializer.data
			if data:
				result[game_type] = data
		return result

	def get_is_standard(self, instance):
		return instance.card_set in CardSet


class InvalidArchetypeException(Exception):
	pass


class ArchetypeMatchupDataSerializer(Serializer):
	id = SerializerMethodField()
	winrate = SerializerMethodField()

	def get_id(self, instance):
		return instance["id"]

	def get_winrate(self, instance):
		return instance["win_rate"]


class ArchetypeDeckDataSerializer(Serializer):
	url = SerializerMethodField()
	winrate = SerializerMethodField()

	def get_url(self, instance):
		return "https://hsreplay.net/decks/%s/" % instance["deck_id"]

	def get_winrate(self, instance):
		return instance["win_rate"]


class ArchetypeDataSerializer(Serializer):
	MIN_GAMES_THRESHOLD = 100

	winrate = SerializerMethodField()
	class_popularity = SerializerMethodField()
	global_popularity = SerializerMethodField()
	matchups = SerializerMethodField()
	most_popular_deck = SerializerMethodField()
	best_performing_deck = SerializerMethodField()

	_archetype = None
	_decks = None

	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		self._deck_data = kwargs["context"]["deck_data"]
		self._popularity_data = kwargs["context"]["popularity_data"]
		self._matchup_data = kwargs["context"]["matchup_data"]
		if (
			not self._popularity_data or
			not self._matchup_data or
			not self._deck_data
		):
			raise InvalidArchetypeException()

	def to_representation(self, instance):
		if (
			instance["player_class"] not in self._popularity_data or
			str(instance["id"]) not in self._matchup_data or
			instance["player_class"] not in self._deck_data
		):
			raise InvalidArchetypeException()
		return super().to_representation(instance)

	def get_winrate(self, instance):
		return self._get_archetype(instance)["win_rate"]

	def get_class_popularity(self, instance):
		return self._get_archetype(instance)["pct_of_class"]

	def get_global_popularity(self, instance):
		return self._get_archetype(instance)["pct_of_total"]

	def get_matchups(self, instance):
		matchups = [
			dict(id=int(id), **data) for id, data in
			self._matchup_data[str(instance["id"])].items() if
			data["total_games"] >= self.MIN_GAMES_THRESHOLD and int(id) > 0
		]
		if not matchups:
			raise InvalidArchetypeException()
		matchups = sorted(matchups, key=lambda x: x["win_rate"], reverse=True)
		return [
			ArchetypeMatchupDataSerializer(matchup).data
			for matchup in matchups
		]

	def get_most_popular_deck(self, instance):
		decks = sorted(self._get_decks(instance), key=lambda x: x["total_games"], reverse=True)
		serializer = ArchetypeDeckDataSerializer(decks[0])
		return serializer.data

	def get_best_performing_deck(self, instance):
		decks = sorted(self._get_decks(instance), key=lambda x: x["win_rate"], reverse=True)
		serializer = ArchetypeDeckDataSerializer(decks[0])
		return serializer.data

	def _get_archetype(self, instance):
		if self._archetype and self._archetype["archetype_id"] == instance["id"]:
			return self._archetype
		for archetype in self._popularity_data[instance["player_class"]]:
			if archetype["archetype_id"] == instance["id"]:
				self._archetype = archetype
				return archetype
		raise InvalidArchetypeException()

	def _get_decks(self, instance):
		if self._decks:
			return self._decks
		decks = [
			deck for deck in self._deck_data[instance["player_class"]] if
			deck["archetype_id"] == instance["id"]
		]
		if decks:
			self._decks = decks
			return decks
		raise InvalidArchetypeException()


class ArchetypeSerializer(Serializer):
	id = SerializerMethodField()
	name = SerializerMethodField()
	player_class = SerializerMethodField()
	url = SerializerMethodField()
	game_types = SerializerMethodField()
	signature_cards = SerializerMethodField()

	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		self._context = kwargs["context"]

	def to_representation(self, instance):
		try:
			return super().to_representation(instance)
		except InvalidArchetypeException:
			return {}

	def get_id(self, instance):
		return instance["archetype"].id

	def get_name(self, instance):
		return {
			"enUS": instance["archetype"].name
		}

	def get_player_class(self, instance):
		return instance["archetype"].player_class.name

	def get_url(self, instance):
		return "https://hsreplay.net%s" % instance["archetype"].get_absolute_url()

	def get_game_types(self, instance):
		result = dict()
		data = dict(
			id=self.get_id(instance),
			player_class=self.get_player_class(instance)
		)
		serializer = ArchetypeDataSerializer(data, context=self._context[instance["game_type"]])
		result[instance["game_type"]] = serializer.data
		return result

	def get_signature_cards(self, instance):
		signature = instance["archetype"].standard_ccp_signature
		if signature:
			components = sorted(signature["components"], key=lambda x: x[1], reverse=True)
			return [dbf for dbf, _ in components][:2]
		else:
			return []


class ClassArchetypeStatsSerializer(Serializer):
	"""Serializer for an individual archetype stats object

	I.e., the contents of the "top_archetypes" and "popular_archetypes" lists
	attached to each class summary.
	"""

	name = SerializerMethodField()
	url = SerializerMethodField()
	popularity = SerializerMethodField()
	winrate = SerializerMethodField()

	def get_name(self, instance):
		return {
			"enUS": instance["archetype"].name
		}

	def get_url(self, instance):
		return "https://hsreplay.net%s" % instance["archetype"].get_absolute_url()

	def get_popularity(self, instance):
		return instance["stats"]["pct_of_total"]

	def get_winrate(self, instance):
		return instance["stats"]["win_rate"]


class ClassArchetypeSummarySerializer(Serializer):
	"""Serializer for a class summary scoped by game type

	This implementation delegates to ClassArchetypeStatsSerializer for
	rendering archetype stats.
	"""

	winrate = SerializerMethodField()
	url = SerializerMethodField()
	top_archetypes = SerializerMethodField()
	popular_archetypes = SerializerMethodField()

	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		self.game_type = kwargs["context"]["game_type"]
		self.player_class = kwargs["context"]["player_class"]
		self._winrate = kwargs["context"]["winrate"]

	def get_winrate(self, instance):
		return self._winrate

	def get_url(self, instance):
		base_url = "https://hsreplay.net/decks/#playerClasses=%s" % self.player_class.name

		# RANKED_STANDARD doesn't require a filter parameter in the URL

		if self.game_type != "RANKED_STANDARD":
			base_url += "&gameType=%s" % self.game_type

		return base_url

	def _format_archetype_stats(self, instance, sort_fn):
		result = []
		archetypes = sorted(instance.values(), key=sort_fn, reverse=True)

		for archetype in archetypes[0:5]:
			serializer = ClassArchetypeStatsSerializer(archetype)
			result.append(serializer.data)

		return result

	def get_top_archetypes(self, instance):
		return self._format_archetype_stats(instance, lambda x: x["stats"]["win_rate"])

	def get_popular_archetypes(self, instance):
		return self._format_archetype_stats(instance, lambda x: x["stats"]["pct_of_total"])


class ClassSerializer(Serializer):
	"""Serializer for the top-level class summaries in the "classes" endpoint

	This implementation delegates to ClassArchetypeSummarySerializer for
	rendering game type-scoped class summary stats.
	"""

	id = SerializerMethodField()
	name = SerializerMethodField()
	heroes = SerializerMethodField()
	game_types = SerializerMethodField()

	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		self.archetype_stats = kwargs["context"]["archetype_stats"]
		self.class_winrates = kwargs["context"]["class_winrates"]

	def get_id(self, instance):
		return instance["player_class"].name

	def get_name(self, instance):
		active_locales = filter(lambda locale: not locale.unused, enums.Locale)
		return dict(
			(locale.name, enums.get_localized_name(instance["player_class"], locale.name))
			for locale in active_locales
		)

	def get_heroes(self, instance):
		hero_cards = instance["hero_cards"]

		return list(map(
			lambda card: dict(card_id=card.card_id, dbf_id=card.dbf_id),
			hero_cards
		))

	def _get_game_type_stats(self, player_class, game_type, archetypes, archetype_stats):

		# Build up a map that looks like:
		#  { archetype_id: { "archetype": ..., "stats": ... } }
		# ...where "archetype" is the dimensional data about archetypes from
		# our relational database, and "stats" is the statistical data from the
		# data warehouse.
		#
		# First, add in all the dimensional data...

		archetype_stats_map = dict(
			(archetype.id, {"archetype": archetype})
			for archetype in archetypes
		)

		# ...then add the stats...

		for stats in archetype_stats:
			archetype_id = stats["archetype_id"]
			if archetype_id in archetype_stats_map:
				archetype_stats_map[archetype_id]["stats"] = stats

		# ...then scrub any entries we don't have stats for.

		for archetype_id in list(archetype_stats_map.keys()):
			if "stats" not in archetype_stats_map[archetype_id]:
				del archetype_stats_map[archetype_id]

		wr_data = next(
			(
				x for x in self.class_winrates[player_class.name]
				if x["game_type"] == GAME_TYPES[game_type]
			),
			None
		)
		winrate = wr_data["win_rate"] if wr_data else None

		serializer = ClassArchetypeSummarySerializer(archetype_stats_map, context={
			"game_type": game_type,
			"player_class": player_class,
			"winrate": winrate
		})
		return serializer.data

	def get_game_types(self, instance):
		result = dict()

		for game_type in self.archetype_stats.keys():
			player_class = instance["player_class"]
			archetype_stats = self.archetype_stats[game_type][player_class.name]
			result[game_type] = self._get_game_type_stats(
				player_class,
				game_type,
				instance["archetypes"],
				archetype_stats
			)

		return result
