import os

import pytest
from pkg_resources import resource_filename


def _bouncy_fixture(name):
	fixtures_dir = resource_filename("django_bouncy", "tests/examples")
	with open(os.path.join(fixtures_dir, name)) as f:
		data = f.read()
	return data


@pytest.mark.django_db
def test_hard_bounce_signal(client, user):
	fixture_data = _bouncy_fixture("example_bounce_notification.json")
	email = "username@example.com"  # From the fixture
	user.email = email
	user.save()

	resp = client.post("/email/bounces/", data=fixture_data, content_type="application/json")
	assert resp.status_code == 200

	user = user.__class__.objects.get(id=user.id)
	assert user.email == ""
