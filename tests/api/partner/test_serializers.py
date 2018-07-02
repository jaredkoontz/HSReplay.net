from django_hearthstone.cards.models import Card
from hearthstone.enums import CardClass

from hsreplaynet.api.partner.serializers import (
	ClassArchetypeStatsSerializer, ClassArchetypeSummarySerializer, ClassSerializer
)
from hsreplaynet.decks.models import Archetype


TOKEN_DRUID_ARCHETYPE = Archetype(id=7, name="Token Druid", player_class=2)

TOKEN_DRUID_STATS = {
	"archetype_id": 7,
	"pct_of_class": 21.6,
	"pct_of_total": 3.37,
	"total_games": 253279,
	"win_rate": 53.6
}

TOKEN_DRUID_SUMMARY = {
	"name": {
		"enUS": "Token Druid"
	},
	"url": "https://hsreplay.net/archetypes/7/token-druid",
	"popularity": 3.37,
	"winrate": 53.6
}

SPITEFUL_DRUID_ARCHETYPE = Archetype(id=205, name="Spiteful Druid", player_class=2)

SPITEFUL_DRUID_STATS = {
	"archetype_id": 205,
	"pct_of_class": 4.14,
	"pct_of_total": 0.65,
	"total_games": 48601,
	"win_rate": 52.33
}

SPITEFUL_DRUID_SUMMARY = {
	"name": {
		"enUS": "Spiteful Druid"
	},
	"url": "https://hsreplay.net/archetypes/205/spiteful-druid",
	"popularity": 0.65,
	"winrate": 52.33
}

QUEST_DRUID_ARCHETYPE = Archetype(id=150, name="Quest Druid", player_class=2)

QUEST_DRUID_STATS = {
	"archetype_id": 150,
	"pct_of_class": 1.52,
	"pct_of_total": 0.74,
	"total_games": 17849,
	"win_rate": 42.96
}

QUEST_DRUID_SUMMARY = {
	"name": {
		"enUS": "Quest Druid"
	},
	"url": "https://hsreplay.net/archetypes/150/quest-druid",
	"popularity": 0.74,
	"winrate": 42.96
}

MILL_DRUID_ARCHETYPE = Archetype(id=226, name="Mill Druid", player_class=2)

MILL_DRUID_STATS = {
	"archetype_id": 226,
	"pct_of_class": 3.29,
	"pct_of_total": 0.51,
	"total_games": 38579,
	"win_rate": 49.78
}

MILL_DRUID_SUMMARY = {
	"name": {
		"enUS": "Mill Druid"
	},
	"url": "https://hsreplay.net/archetypes/226/mill-druid",
	"popularity": 0.51,
	"winrate": 49.78
}


class TestClassArchetypeStatsSerializer(object):

	def test_serialized_data(self):
		serializer = ClassArchetypeStatsSerializer({
			"archetype": TOKEN_DRUID_ARCHETYPE,
			"stats": TOKEN_DRUID_STATS
		})
		assert serializer.data == TOKEN_DRUID_SUMMARY


class TestClassArchetypeSummarySerializer(object):

	def test_serialized_data(self):
		serializer = ClassArchetypeSummarySerializer({
			7: {
				"archetype": TOKEN_DRUID_ARCHETYPE,
				"stats": TOKEN_DRUID_STATS
			},
			205: {
				"archetype": SPITEFUL_DRUID_ARCHETYPE,
				"stats": SPITEFUL_DRUID_STATS
			},
			150: {
				"archetype": QUEST_DRUID_ARCHETYPE,
				"stats": QUEST_DRUID_STATS
			},
			226: {
				"archetype": MILL_DRUID_ARCHETYPE,
				"stats": MILL_DRUID_STATS
			}
		}, context={
			"game_type": "RANKED_STANDARD",
			"player_class": CardClass.DRUID
		})

		assert serializer.data == {
			"url": "https://hsreplay.net/decks/#playerClasses=DRUID",
			"top_archetypes": [
				TOKEN_DRUID_SUMMARY,
				SPITEFUL_DRUID_SUMMARY,
				MILL_DRUID_SUMMARY
			],
			"popular_archetypes": [
				TOKEN_DRUID_SUMMARY,
				QUEST_DRUID_SUMMARY,
				SPITEFUL_DRUID_SUMMARY
			]
		}


class TestClassSerializer(object):

	def test_serialized_data(self):
		serializer = ClassSerializer({
			"archetypes": [
				MILL_DRUID_ARCHETYPE,
				QUEST_DRUID_ARCHETYPE,
				SPITEFUL_DRUID_ARCHETYPE,
				TOKEN_DRUID_ARCHETYPE
			],
			"player_class": CardClass.DRUID,
			"hero_cards": [
				Card(dbf_id=274, card_id="HERO_06", name="Malfurion Stormrage"),
				Card(dbf_id=50484, card_id="HERO_06a", name="Lunara")
			]
		}, context={
			"archetype_stats": {
				"RANKED_STANDARD": {
					"DRUID": [
						MILL_DRUID_STATS,
						QUEST_DRUID_STATS,
						SPITEFUL_DRUID_STATS,
						TOKEN_DRUID_STATS
					]
				}
			}
		})

		assert serializer.data == {
			"id": "DRUID",
			"name": {
				"deDE": "Druide",
				"enUS": "Druid",
				"esES": "Druida",
				"esMX": "Druida",
				"frFR": "Druide",
				"itIT": "Druido",
				"jaJP": "ドルイド",
				"koKR": "드루이드",
				"plPL": "Druid",
				"ptBR": "Druida",
				"ruRU": "Друид",
				"thTH": "ดรูอิด",
				"zhCN": "德鲁伊",
				"zhTW": "德魯伊"
			},
			"heroes": [{
				"dbf_id": 274,
				"card_id": "HERO_06"
			}, {
				"dbf_id": 50484,
				"card_id": "HERO_06a"
			}],
			"game_types": {
				"RANKED_STANDARD": {
					"url": "https://hsreplay.net/decks/#playerClasses=DRUID",
					"top_archetypes": [
						TOKEN_DRUID_SUMMARY,
						SPITEFUL_DRUID_SUMMARY,
						MILL_DRUID_SUMMARY
					],
					"popular_archetypes": [
						TOKEN_DRUID_SUMMARY,
						QUEST_DRUID_SUMMARY,
						SPITEFUL_DRUID_SUMMARY
					]
				}
			}
		}
