from rest_framework.serializers import Serializer, SerializerMethodField


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
	best_matchup = SerializerMethodField()
	worst_matchup = SerializerMethodField()
	most_popular_deck = SerializerMethodField()
	best_performing_deck = SerializerMethodField()

	_archetype = None
	_decks = None
	_matchups = None

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

	def get_best_matchup(self, instance):
		matchups = sorted(self._get_matchups(instance), key=lambda x: x["win_rate"])
		serializer = ArchetypeMatchupDataSerializer(matchups[-1])
		return serializer.data

	def get_worst_matchup(self, instance):
		matchups = sorted(self._get_matchups(instance), key=lambda x: x["win_rate"])
		serializer = ArchetypeMatchupDataSerializer(matchups[0])
		return serializer.data

	def get_most_popular_deck(self, instance):
		decks = sorted(self._get_decks(instance), key=lambda x: x["total_games"], reverse=True)
		serializer = ArchetypeDeckDataSerializer(decks[0])
		return serializer.data

	def get_best_performing_deck(self, instance):
		decks = sorted(self._get_decks(instance), key=lambda x: x["win_rate"], reverse=True)
		serializer = ArchetypeDeckDataSerializer(decks[0])
		return serializer.data

	def _get_archetype(self, instance):
		if self._archetype:
			return self._archetype
		for archetype in self._popularity_data[instance["player_class"]]:
			if archetype["archetype_id"] == instance["id"]:
				self._archetype = archetype
				return archetype
		raise InvalidArchetypeException()

	def _get_matchups(self, instance):
		if self._matchups:
			return self._matchups
		matchups = [
			dict(id=int(id), **data) for id, data in
			self._matchup_data[str(instance["id"])].items() if
			data["total_games"] >= self.MIN_GAMES_THRESHOLD and int(id) > 0
		]
		if matchups:
			self._matchups = matchups
			return matchups
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
	game_types_data = None

	id = SerializerMethodField()
	name = SerializerMethodField()
	player_class = SerializerMethodField()
	url = SerializerMethodField()
	game_types = SerializerMethodField()

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
		if self.game_types_data:
			return self.game_types_data
		result = dict()
		data = dict(
			id=self.get_id(instance),
			player_class=self.get_player_class(instance)
		)
		serializer = ArchetypeDataSerializer(data, context=self._context[instance["game_type"]])
		result[instance["game_type"]] = serializer.data
		self.game_types_data = result
		return result
