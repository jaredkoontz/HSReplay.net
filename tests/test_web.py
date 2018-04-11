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

	response = client.get("/")
	assert response.status_code == 200
