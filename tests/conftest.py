import os
import subprocess

import pytest


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
