from io import StringIO
from unittest.mock import Mock

import pytest
from django.core.management import call_command
from hearthstone import enums
from oauth2_provider.admin import AccessToken

from hearthsim.identity.accounts.models import User
from hsreplaynet.api.partner.views import ClassesView
from hsreplaynet.decks.models import Archetype


TOKEN_DRUID_SUMMARY = {
	"name": {
		"enUS": "Token Druid"
	},
	"url": "https://hsreplay.net/archetypes/7/token-druid",
	"popularity": 3.37,
	"winrate": 53.6
}


@pytest.fixture
@pytest.mark.django_db
def user():
	return User.objects.create_user(
		username="bing", email="bing@microsoft.com", is_fake=True, password="password")


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


class TestClassesView(object):
	view = ClassesView()

	@pytest.mark.django_db
	def test_list(self, client, mocker, partner_token):
		Archetype.objects.create(id=7, player_class=2, name="Token Druid")

		series_data = dict(
			(hsclass.name, [])
			for hsclass in enums.CardClass if hsclass.is_playable
		)
		series_data["DRUID"] = [{
			"archetype_id": 7,
			"pct_of_class": 21.6,
			"pct_of_total": 3.37,
			"total_games": 253279,
			"win_rate": 53.6
		}]

		mock_parameterized_query = Mock(
			result_available=True,
			response_payload=dict(
				series=dict(data=series_data)
			)
		)

		attrs = {
			"build_full_params.return_value": mock_parameterized_query
		}

		mocker.patch(
			"hsreplaynet.api.partner.views.get_redshift_query",
			lambda name: Mock(**attrs)
		)

		response = client.get(
			"/partner-stats/v1/classes/",
			content_type="application/json",
			HTTP_AUTHORIZATION="Bearer %s" % partner_token)

		assert response.status_code == 200

		response_list = response.json()
		response_classes = list(map(lambda x: x["id"], response_list))

		for hsclass in enums.CardClass:
			if hsclass.is_playable:
				assert hsclass.name in response_classes

		for response_obj in response_list:
			assert response_obj["id"] in enums.CardClass.__members__
			for locale in response_obj["name"].keys():
				assert locale in enums.Locale.__members__

			ranked_standard = response_obj["game_types"]["RANKED_STANDARD"]

			assert isinstance(ranked_standard["url"], str)
			assert isinstance(ranked_standard["top_archetypes"], list)
			assert isinstance(ranked_standard["popular_archetypes"], list)

			if response_obj["id"] == "DRUID":
				assert ranked_standard["top_archetypes"] == [TOKEN_DRUID_SUMMARY]
				assert ranked_standard["popular_archetypes"] == [TOKEN_DRUID_SUMMARY]

	@pytest.mark.django_db
	def test_list_unauthorized(self, client):
		response = client.get("/partner-stats/v1/classes/", content_type="application/json")
		assert response.status_code == 401

		response = client.get(
			"/partner-stats/v1/classes/",
			content_type="application/json",
			HTTP_AUTHORIZATION="Bearer Not-A-Real-Access-Token")

		assert response.status_code == 401

	@pytest.mark.django_db
	def test_list_needs_refresh(self, client, mocker, partner_token):
		attrs = {
			"build_full_params.return_value": Mock(result_available=False)
		}

		mocker.patch(
			"hsreplaynet.api.partner.views.get_redshift_query",
			lambda name: Mock(**attrs)
		)

		response = client.get(
			"/partner-stats/v1/classes/",
			content_type="application/json",
			HTTP_AUTHORIZATION="Bearer %s" % partner_token)

		assert response.status_code == 202
