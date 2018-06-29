from io import StringIO

import pytest
from django.core.management import call_command
from hearthstone import enums
from oauth2_provider.models import AccessToken
from rest_framework import status

from hsreplaynet.api.partner.serializers import ArchetypesSerializer
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


@pytest.mark.django_db
def test_partner_api_example(partner_token, client):
	url = "/partner-stats/v1/example/"

	response = client.get(url, content_type="application/json")
	assert response.status_code == 401

	response = client.get(
		url, content_type="application/json",
		HTTP_AUTHORIZATION="Garbage"
	)
	assert response.status_code == 401

	response = client.get(
		url, content_type="application/json",
		HTTP_AUTHORIZATION="Bearer Garbage"
	)
	assert response.status_code == 401

	response = client.get(
		url, content_type="application/json",
		HTTP_AUTHORIZATION="Bearer %s" % partner_token
	)
	assert response.status_code == 200


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
		decks=archetypes_serializer_data["decks"],
		popularity=archetypes_serializer_data["popularity"],
		matchups=archetypes_serializer_data["matchups"]
	)

	serializer = ArchetypesSerializer(instance=mock_data)
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
	matchups["2"]["3"]["total_games"] = ArchetypesSerializer.MIN_GAMES_THRESHOLD - 1

	mock_data = dict(
		game_type="RANKED_STANDARD",
		archetype=archetype,
		decks=archetypes_serializer_data["decks"],
		popularity=archetypes_serializer_data["popularity"],
		matchups=matchups
	)

	serializer = ArchetypesSerializer(instance=mock_data)
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

	def mock_get_archetypes(self, gametype):
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
