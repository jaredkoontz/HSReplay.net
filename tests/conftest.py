import os
import subprocess

import pytest
from moto import mock_dynamodb2

from hearthsim.identity.accounts.models import AuthToken
from hearthsim.identity.api.models import APIKey
from hsreplaynet.games.models.dynamodb import GameReplay as DynamoDBGameReplay


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
	return get_user_model().objects.create_user("Test#1234", email="test_user@example.com")


@pytest.yield_fixture(scope="function")
def api_key(db):
	return APIKey.objects.create(
		full_name="TestClient",
		email="test_client@example.com",
		website="https://example.com",
	)


@pytest.yield_fixture(scope="function")
def auth_token(db, api_key, user):
	return AuthToken.objects.create(
		creation_apikey=api_key,
		user=user,
	)


@pytest.fixture(scope="module")
def multi_db():
	from django.test import TestCase
	TestCase.multi_db = True
	yield
	TestCase.multi_db = False


@pytest.fixture
def game_replay_dynamodb_table(mocker):
	mocker.patch.multiple(
		"hsreplaynet.games.models.dynamodb.GameReplay.Meta",
		host=None,
		aws_access_key_id="test",
		aws_secret_access_key="test",
	)
	with mock_dynamodb2():
		DynamoDBGameReplay.create_table(wait=True)
		yield
		DynamoDBGameReplay.delete_table()
