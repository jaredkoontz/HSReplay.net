import pytest
from allauth.socialaccount.providers import registry


def test_battlenet_auth_loaded():
	assert registry.loaded
	provider = registry.by_id("battlenet")
	assert provider.id == "battlenet"


@pytest.mark.django_db
def test_load_homepage(client, settings, mocker):
	# Disable (Manifest)StaticFilesStorage, since tests will not run collectstatic
	settings.STATICFILES_STORAGE = settings.DEFAULT_FILE_STORAGE

	# Until we start mocking aws.utils.redshift, mock HomeView.get_winrate_data directly
	with mocker.patch("hsreplaynet.web.views.HomeView.get_winrate_data") as get_winrate_data:
		get_winrate_data.return_value = {"standard": {}, "wild": {}}

	response = client.get("/")
	assert response.status_code == 200
