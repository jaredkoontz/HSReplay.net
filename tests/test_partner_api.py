from io import StringIO

import pytest
from django.core.management import call_command
from oauth2_provider.models import AccessToken


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
