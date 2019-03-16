import json

import pytest

from hsreplaynet.games.serializers import UploadEventSerializer
from hsreplaynet.uploads.models import UploadEvent


TEST_METADATA = {
	"build": 25770,
	"match_start": "2018-09-22T14:03:34.505Z",
}


TEST_TWITCH_VOD_METADATA = {
	"build": 25770,
	"match_start": "2018-09-22T14:03:34.505Z",
	"twitch_vod": {
		"channel_name": "Test Channel",
		"language": "en-gb",
		"url": "https://www.twitch.tv/videos/12345?t=0h0m0s"
	}
}


class TestUploadEventSerializer:

	@pytest.mark.django_db
	def test_minimal(self):
		obj = UploadEvent()
		obj.save()

		serializer = UploadEventSerializer(obj, data=TEST_METADATA)

		assert serializer.is_valid()
		serializer.save()

		actual_metadata = json.loads(obj.metadata)
		for key, value in TEST_METADATA.items():
			assert actual_metadata[key] == value

	@pytest.mark.django_db
	def test_twitch_vod(self):
		obj = UploadEvent()
		obj.save()

		serializer = UploadEventSerializer(obj, data=TEST_TWITCH_VOD_METADATA)

		assert serializer.is_valid()
		serializer.save()

		actual_metadata = json.loads(obj.metadata)
		for key, value in TEST_TWITCH_VOD_METADATA.items():
			assert actual_metadata[key] == value
