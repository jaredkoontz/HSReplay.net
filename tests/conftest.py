import os
import subprocess
from uuid import uuid4

import pytest

from hearthsim.identity.accounts.models import AuthToken
from hearthsim.identity.api.models import APIKey


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_DATA_DIR = os.path.join(BASE_DIR, "logdata")
LOG_DATA_GIT = "https://github.com/HearthSim/hsreplay-test-data"
UPLOAD_SUITE = os.path.join(LOG_DATA_DIR, "hsreplaynet-tests", "uploads")

pytest_plugins = ["tests.api.partner.fixtures"]


def pytest_configure(config):
	if not os.path.exists(LOG_DATA_DIR):
		proc = subprocess.Popen(["git", "clone", LOG_DATA_GIT, LOG_DATA_DIR])
		assert proc.wait() == 0


@pytest.yield_fixture(scope="function")
def user(db):
	from django.contrib.auth import get_user_model
	user, created = get_user_model().objects.get_or_create(username="user")
	return user


@pytest.yield_fixture(scope="function")
def api_key(db):
	return APIKey.objects.get_or_create(
		api_key=str(uuid4()),
		defaults={
			"full_name": "Test Client",
			"email": "test@example.org",
			"website": "https://example.org",
		}
	)[0]


@pytest.yield_fixture(scope="function")
def auth_token(db, api_key):
	token = AuthToken.objects.get_or_create(
		key=str(uuid4()),
		creation_apikey=api_key
	)[0]
	token.create_fake_user(save=True)
	return token
