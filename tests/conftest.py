import base64
import os
import subprocess

import pytest


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_DATA_DIR = os.path.join(BASE_DIR, "logdata")
LOG_DATA_GIT = "https://github.com/HearthSim/hsreplay-test-data"
UPLOAD_SUITE = os.path.join(LOG_DATA_DIR, "hsreplaynet-tests", "uploads")


def pytest_configure(config):
	if not os.path.exists(LOG_DATA_DIR):
		proc = subprocess.Popen(["git", "clone", LOG_DATA_GIT, LOG_DATA_DIR])
		assert proc.wait() == 0


@pytest.yield_fixture(scope="function")
def user(db):
	from django.contrib.auth import get_user_model
	user, created = get_user_model().objects.get_or_create(username="user")
	return user


@pytest.yield_fixture(scope="session")
def upload_context():
	yield None


@pytest.yield_fixture(scope="session")
def upload_event():
	yield {
		"body": base64.b64encode('{"player1_rank": 5}'.encode("utf8")).decode("ascii"),
		"event": {
			"httpMethod": "POST",
			"isBase64Encoded": True,
			"headers": {
				"Authorization": "Token beh7141d-c437-4bfe-995e-1b3a975094b1",
			},
			"requestContext": {
				"identity": {
					"userAgent": "HSReplay.net Tests",
					"sourceIp": "127.0.0.1",
				}
			}
		},
	}


@pytest.yield_fixture(scope="session")
def s3_create_object_event():
	yield {
		"Records": [{
			"s3": {
				"bucket": {
					"name": "hsreplaynet-raw-log-uploads",
				},
				"object": {
					"key": "raw/2016/07/20/10/37/hUHupxzE9GfBGoEE8ECQiN/power.log",
				}
			}
		}]
	}
