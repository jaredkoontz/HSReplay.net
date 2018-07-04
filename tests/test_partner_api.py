from io import StringIO

import pytest
from django.core.management import call_command
from django_hearthstone.cards.models import Card
from hearthstone import enums
from oauth2_provider.models import AccessToken
from rest_framework import status

from hsreplaynet.api.partner.serializers import (
	ArchetypeDataSerializer, ArchetypeSerializer, CardDataDeckSerializer,
	CardDataSerializer, CardSerializer, InvalidCardException
)
from hsreplaynet.api.partner.utils import QueryDataNotAvailableException
from hsreplaynet.decks.models import Archetype


@pytest.fixture
def partner_token(user):
	out = StringIO()
	call_command(
		"grant_partner_access",
		user.username,
		noinput=True, stdout=out
	)

	token = AccessToken.objects.get(user=user)
	return str(token.token)


@pytest.fixture(scope="function")
def archetypes_serializer_data():
	decks = dict(
		DRUID=[
			dict(
				archetype_id=1,
				win_rate=49.49,
				deck_id="abc",
				total_games=345
			), dict(
				archetype_id=1,
				win_rate=51.51,
				deck_id="abc2",
				total_games=234
			), dict(
				archetype_id=2,
				win_rate=52.52,
				deck_id="def",
				total_games=345
			)
		]
	)

	popularity = dict(
		DRUID=[
			dict(
				archetype_id=1,
				win_rate=50.50,
				pct_of_class=12.34,
				pct_of_total=4.56,
			), dict(
				archetype_id=2,
				win_rate=52.52,
				pct_of_class=23.45,
				pct_of_total=5.67,
			)
		]
	)

	matchups = {
		"1": {
			"2": dict(
				win_rate=50.50,
				total_games=123
			),
			"3": dict(
				win_rate=51.51,
				total_games=234
			),
			"4": dict(
				win_rate=52.52,
				total_games=345
			)
		},
		"2": {
			"3": dict(
				win_rate=50.50,
				total_games=123
			),
		}
	}
	return dict(
		decks=decks,
		popularity=popularity,
		matchups=matchups
	)


@pytest.mark.django_db
def test_archetypes_serializer(archetypes_serializer_data):
	archetype = Archetype.objects.create(
		id=1,
		name="Archetype 1",
		player_class=enums.CardClass.DRUID,
	)

	mock_data = dict(
		game_type="RANKED_STANDARD",
		archetype=archetype,
	)
	context = dict(
		RANKED_STANDARD=dict(
			deck_data=archetypes_serializer_data["decks"],
			popularity_data=archetypes_serializer_data["popularity"],
			matchup_data=archetypes_serializer_data["matchups"]
		)
	)

	serializer = ArchetypeSerializer(instance=mock_data, context=context)
	data = serializer.data

	assert "id" in data
	assert data["id"] == 1

	assert "name" in data
	assert len(data["name"].keys()) == 1
	assert "enUS" in data["name"]
	assert data["name"]["enUS"] == "Archetype 1"

	assert "player_class" in data
	assert data["player_class"] == "DRUID"

	assert "url" in data
	assert data["url"] == "https://hsreplay.net/archetypes/1/archetype-1"

	assert "game_types" in data
	assert len(data["game_types"].keys()) == 1
	assert "RANKED_STANDARD" in data["game_types"]

	ranked_standard = data["game_types"]["RANKED_STANDARD"]
	assert "winrate" in ranked_standard
	assert ranked_standard["winrate"] == 50.50

	assert "class_popularity" in ranked_standard
	assert ranked_standard["class_popularity"] == 12.34

	assert "global_popularity" in ranked_standard
	assert ranked_standard["global_popularity"] == 4.56

	assert "best_matchup" in ranked_standard
	assert "id" in ranked_standard["best_matchup"]
	assert ranked_standard["best_matchup"]["id"] == 4
	assert "winrate" in ranked_standard["best_matchup"]
	assert ranked_standard["best_matchup"]["winrate"] == 52.52

	assert "worst_matchup" in ranked_standard
	assert "id" in ranked_standard["worst_matchup"]
	assert ranked_standard["worst_matchup"]["id"] == 2
	assert "winrate" in ranked_standard["worst_matchup"]
	assert ranked_standard["worst_matchup"]["winrate"] == 50.50

	assert "most_popular_deck" in ranked_standard
	assert "url" in ranked_standard["most_popular_deck"]
	assert ranked_standard["most_popular_deck"]["url"] == "https://hsreplay.net/decks/abc/"
	assert "winrate" in ranked_standard["most_popular_deck"]
	assert ranked_standard["most_popular_deck"]["winrate"] == 49.49

	assert "best_performing_deck" in ranked_standard
	assert "url" in ranked_standard["best_performing_deck"]
	assert ranked_standard["best_performing_deck"]["url"] == "https://hsreplay.net/decks/abc2/"
	assert "winrate" in ranked_standard["best_performing_deck"]
	assert ranked_standard["best_performing_deck"]["winrate"] == 51.51


@pytest.mark.django_db
def test_archetypes_serializer_low_data(archetypes_serializer_data):
	archetype = Archetype.objects.create(
		id=2,
		name="Archetype 2",
		player_class=enums.CardClass.DRUID,
	)

	matchups = archetypes_serializer_data["matchups"]
	matchups["2"]["3"]["total_games"] = ArchetypeDataSerializer.MIN_GAMES_THRESHOLD - 1

	mock_data = dict(
		game_type="RANKED_STANDARD",
		archetype=archetype,
	)

	context = dict(
		RANKED_STANDARD=dict(
			deck_data=archetypes_serializer_data["decks"],
			popularity_data=archetypes_serializer_data["popularity"],
			matchup_data=matchups
		)
	)

	serializer = ArchetypeSerializer(instance=mock_data, context=context)
	data = serializer.data
	assert not data


def test_archetypes_view_no_redshift_data(client, mocker, partner_token):
	def mock_get_query_data(self, query_name, game_type):
		raise QueryDataNotAvailableException()
	mocker.patch(
		"hsreplaynet.api.partner.views.ArchetypesView._get_query_data",
		new=mock_get_query_data
	)
	response = client.get(
		"/partner-stats/v1/archetypes/",
		HTTP_AUTHORIZATION="Bearer %s" % partner_token
	)
	assert response.status_code == status.HTTP_202_ACCEPTED


@pytest.mark.django_db
def test_archetypes_view_valid_data(
	archetypes_serializer_data, client, mocker, partner_token
):
	archetype = Archetype.objects.create(
		id=1,
		name="Archetype 1",
		player_class=enums.CardClass.DRUID,
	)

	def mock_get_query_data(self, query_name, game_type):
		if query_name == "list_decks_by_win_rate":
			return archetypes_serializer_data["decks"]
		elif query_name == "archetype_popularity_distribution_stats":
			return archetypes_serializer_data["popularity"]
		elif query_name == "head_to_head_archetype_matchups":
			return archetypes_serializer_data["matchups"]
		raise Exception()

	def mock_get_archetypes(self):
		return [archetype]
	mocker.patch(
		"hsreplaynet.api.partner.views.ArchetypesView._get_query_data",
		new=mock_get_query_data
	)
	mocker.patch(
		"hsreplaynet.api.partner.views.ArchetypesView._get_archetypes",
		new=mock_get_archetypes
	)
	response = client.get(
		"/partner-stats/v1/archetypes/",
		HTTP_AUTHORIZATION="Bearer %s" % partner_token
	)
	assert response.status_code == status.HTTP_200_OK
	assert response.data


def test_archetypes_view_not_authorized(client):
	response = client.get("/partner-stats/v1/archetypes/")
	assert response.status_code == status.HTTP_401_UNAUTHORIZED


TEST_DRUID_DECK_WRATH_1 = {
	"deck_id": "EKlKw4ILElCR1xS3abC65g",
	"deck_list": "[[43417,1],[42656,2],[45828,2],[43483,1],[381,2],[1124,2],[40991,1],[47063,2],[836,2],[503,1],[1029,2],[42759,2],[95,2],[43294,2],[64,2],[43288,2],[742,2]]", # flake8: noqa
	"archetype_id": 1,
	"win_rate": 56.67,
}

TEST_DRUID_DECK_WRATH_2 = {
	"deck_id": "dZbiSO2L9QQTwPj991OMz",
	"deck_list": "[[43417,1],[42656,2],[45828,2],[43483,2],[381,2],[1124,2],[45945,1],[47063,2],[836,1],[503,1],[1029,2],[42759,2],[95,2],[43294,2],[64,2],[43288,2],[742,2]]", # flake8: noqa
	"archetype_id": 2,
	"win_rate": 57.52,
}

TEST_DRUID_DECK_WRATH_3 = {
	"deck_id": "dZbIqtWpso2L9Qj991OMz",
	"deck_list": "[[43417,1],[42656,2],[45828,2],[43483,2],[381,2],[1124,2],[45945,1],[47063,2],[836,1],[503,1],[1029,2],[42759,2],[95,2],[43294,2],[64,2],[43288,2],[742,2]]", # flake8: noqa
	"archetype_id": 1,
	"win_rate": 55.52,
}

TEST_DRUID_DECK_NO_WRATH = {
	"deck_id": "qujK2o4dkGGEwNnXCNOU7g",
	"deck_list": "[[43417,1],[46032,1],[41418,2],[45945,2],[46551,2],[43025,2],[754,2],[46859,2],[41323,2],[41111,2],[734,2],[42759,2],[42442,2],[45265,2],[45340,1],[42395,2],[42818,1]]", # flake8: noqa
	"archetype_id": 205,
	"win_rate": 57.54,
}

TEST_DRUID_ARCHETYPE = {
	"id": 1,
	"name": "Test Druid",
	"player_class": enums.CardClass.DRUID,
}

TEST_DRUID_ARCHETYPE_2 = {
	"id": 2,
	"name": "Test Druid 2",
	"player_class": enums.CardClass.DRUID,
}

EXPECTED_TEST_DRUID_DECK_DATA_1 = {
	"name": {
		"enUS": TEST_DRUID_ARCHETYPE["name"]
	},
	"player_class": TEST_DRUID_ARCHETYPE["player_class"].name,
	"url": "https://hsreplay.net/decks/%s/" % TEST_DRUID_DECK_WRATH_1["deck_id"],
	"winrate": TEST_DRUID_DECK_WRATH_1["win_rate"],
}

EXPECTED_TEST_DRUID_DECK_DATA_2 = {
	"name": {
		"enUS": TEST_DRUID_ARCHETYPE_2["name"]
	},
	"player_class": TEST_DRUID_ARCHETYPE_2["player_class"].name,
	"url": "https://hsreplay.net/decks/%s/" % TEST_DRUID_DECK_WRATH_2["deck_id"],
	"winrate": TEST_DRUID_DECK_WRATH_2["win_rate"],
}

WRATH_POPULARITY_DATA = {
	"dbf_id": 836,
	"popularity": 9.83,
	"winrate": 52.60,
}

RAVENCALLER_POPULARITY_DATA = {
	"dbf_id": 46661,
	"popularity": 0.23,
	"winrate": 44.51,
}

DECK_DATA = {
	"DRUID": [
		TEST_DRUID_DECK_WRATH_1,
		TEST_DRUID_DECK_NO_WRATH,
		TEST_DRUID_DECK_WRATH_2,
		TEST_DRUID_DECK_WRATH_3
	],
}

POPULARITY_DATA = [WRATH_POPULARITY_DATA, RAVENCALLER_POPULARITY_DATA]

EXPECTED_WRATH_CARD_DATA = {
	"url": "https://hsreplay.net/cards/836/wrath#gameType=RANKED_STANDARD",
	"popularity": WRATH_POPULARITY_DATA["popularity"],
	"deck_winrate": WRATH_POPULARITY_DATA["winrate"],
	"top_decks": [EXPECTED_TEST_DRUID_DECK_DATA_2, EXPECTED_TEST_DRUID_DECK_DATA_1]
}

EXPECTED_WRATH_DATA = {
	"card_id": "EX1_154",
	"dbf_id": 836,
	"game_types": {
		"RANKED_STANDARD": EXPECTED_WRATH_CARD_DATA,
	}
}


class TestCardDataDeckSerializer(object):
	@pytest.mark.django_db
	def test_serialized_data(self):
		Archetype.objects.create(**TEST_DRUID_ARCHETYPE)
		serializer = CardDataDeckSerializer(TEST_DRUID_DECK_WRATH_1)
		assert serializer.data == EXPECTED_TEST_DRUID_DECK_DATA_1


class TestCardDataSerializer(object):
	@pytest.mark.django_db
	def test_serialized_data(self):
		Archetype.objects.create(**TEST_DRUID_ARCHETYPE)
		Archetype.objects.create(**TEST_DRUID_ARCHETYPE_2)
		data = {
			"game_type": "RANKED_STANDARD",
			"card": Card.objects.get(dbf_id=836)
		}
		context = {
			"deck_data": DECK_DATA,
			"popularity_data": POPULARITY_DATA
		}
		serializer = CardDataSerializer(data, context=context)
		assert serializer.data == EXPECTED_WRATH_CARD_DATA

	@pytest.mark.django_db
	def test_missing_data(self):
		data = {
			"game_type": "RANKED_STANDARD",
			"card": Card.objects.get(dbf_id=836)
		}
		data = CardDataSerializer(data, context={
			"deck_data": {},
			"popularity_data": POPULARITY_DATA
		}).data
		with pytest.raises(InvalidCardException):
			data = CardDataSerializer(data, context={
				"deck_data": DECK_DATA,
				"popularity_data": {}
			}).data

	@pytest.mark.django_db
	def test_missing_dbf_id(self):
		data = {
			"game_type": "RANKED_STANDARD",
			"card": Card.objects.get(dbf_id=1050)
		}
		with pytest.raises(InvalidCardException):
			data = CardDataSerializer(data, context={
				"deck_data": DECK_DATA,
				"popularity_data": POPULARITY_DATA
			}).data


class TestCardSerializer(object):
	@pytest.mark.django_db
	def test_serialized_data(self):
		Archetype.objects.create(**TEST_DRUID_ARCHETYPE)
		Archetype.objects.create(**TEST_DRUID_ARCHETYPE_2)

		data = Card.objects.get(dbf_id=836)
		context = {
			"game_type_data": {
				"RANKED_STANDARD": {
					"deck_data": DECK_DATA,
					"popularity_data": POPULARITY_DATA,
				}
			}
		}

		serializer = CardSerializer(data, context=context)
		assert serializer.data == EXPECTED_WRATH_DATA


def test_cards_view_no_redshift_data(client, mocker, partner_token):
	def mock_get_query_data(self, query_name, game_type):
		raise QueryDataNotAvailableException()
	mocker.patch(
		"hsreplaynet.api.partner.views.CardsView._get_query_data",
		new=mock_get_query_data
	)
	response = client.get(
		"/partner-stats/v1/cards/",
		HTTP_AUTHORIZATION="Bearer %s" % partner_token
	)
	assert response.status_code == status.HTTP_202_ACCEPTED


@pytest.mark.django_db
def test_cards_view_valid_data(client, mocker, partner_token):
	Archetype.objects.create(**TEST_DRUID_ARCHETYPE)
	Archetype.objects.create(**TEST_DRUID_ARCHETYPE_2)
	def mock_get_query_data(self, query_name, game_type):
		if query_name == "list_decks_by_win_rate":
			return DECK_DATA
		elif query_name == "card_included_popularity_report":
			return {"ALL": POPULARITY_DATA}
		raise Exception()

	mocker.patch(
		"hsreplaynet.api.partner.views.CardsView._get_query_data",
		new=mock_get_query_data
	)
	response = client.get(
		"/partner-stats/v1/cards/",
		HTTP_AUTHORIZATION="Bearer %s" % partner_token
	)
	assert response.status_code == status.HTTP_200_OK
	assert response.data


def test_cards_view_not_authorized(client):
	response = client.get("/partner-stats/v1/cards/")
	assert response.status_code == status.HTTP_401_UNAUTHORIZED
