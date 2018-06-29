from rest_framework.serializers import Serializer, SerializerMethodField


class ArchetypesSerializer(Serializer):
	MIN_GAMES_THRESHOLD = 100
	game_types_data = None

	id = SerializerMethodField()
	name = SerializerMethodField()
	player_class = SerializerMethodField()
	url = SerializerMethodField()
	game_types = SerializerMethodField()

	def to_representation(self, instance):
		data = self.get_game_types(instance)[instance["game_type"]]
		for key in data.keys():
			if not data[key]:
				return {}
		return super().to_representation(instance)

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
		result[instance["game_type"]] = dict(
			winrate=self._get_archetype_data(instance, "win_rate"),
			class_popularity=self._get_archetype_data(instance, "pct_of_class"),
			global_popularity=self._get_archetype_data(instance, "pct_of_total"),
			best_matchup=self._get_sorted_matchup(instance, True),
			worst_matchup=self._get_sorted_matchup(instance, False),
			most_popular_deck=self._get_sorted_deck(instance, "total_games", True),
			best_performing_deck=self._get_sorted_deck(instance, "win_rate", True),
		)
		self.game_types_data = result
		return result

	def _get_sorted_deck(self, instance, key, reverse):
		class_decks = instance["decks"]
		player_class = self.get_player_class(instance)
		if not class_decks or player_class not in class_decks:
			return None
		archetype_id = self.get_id(instance)
		decks = [
			deck for deck in class_decks[player_class] if deck["archetype_id"] == archetype_id
		]
		if not decks:
			return None
		decks = [dict(
			url="https://hsreplay.net/decks/%s/" % deck["deck_id"],
			winrate=deck["win_rate"]
		) for deck in sorted(decks, key=lambda x: x[key], reverse=reverse)]
		if decks:
			return decks[0]
		return None

	def _get_archetype_data(self, instance, key):
		popularity = instance["popularity"]
		player_class = self.get_player_class(instance)
		if not popularity or player_class not in popularity:
			return None
		archetype_id = self.get_id(instance)
		for archetype in popularity[player_class]:
			if archetype["archetype_id"] == archetype_id:
				return archetype[key]
		return None

	def _get_sorted_matchup(self, instance, reverse):
		archetype_id = str(self.get_id(instance))
		all_matchups = instance["matchups"]
		if not all_matchups or archetype_id not in all_matchups:
			return None
		matchups = sorted([
			dict(id=int(id), winrate=data["win_rate"])
			for id, data in all_matchups[archetype_id].items() if
			data["total_games"] >= self.MIN_GAMES_THRESHOLD and int(id) > 0
		], key=lambda x: x["winrate"], reverse=reverse)
		if matchups:
			return matchups[0]
		return None
