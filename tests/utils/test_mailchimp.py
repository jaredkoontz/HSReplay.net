from allauth.account.models import EmailAddress
from mailchimp3 import MailChimp
from mailchimp3.helpers import get_subscriber_hash

from hsreplaynet.utils.mailchimp import (
	ListMemberTags, find_best_email_for_user, get_mailchimp_subscription_status
)


class TestListMemberTags:

	MAILCHIMP_TEST_ENDPOINT = "https://test.api.mailchimp.com/3.0/"

	def setup_method(self):
		baseapi = MailChimp(mc_api="abcdef12345678900000000000000000-test")
		self.tags = ListMemberTags(baseapi)

	def _construct_endpoint(self, email):
		return "%slists/123456/members/%s/tags" % (
			self.MAILCHIMP_TEST_ENDPOINT,
			get_subscriber_hash(email)
		)

	def test_add(self, requests_mock):
		adapter = requests_mock.post(self._construct_endpoint("test@example.com"), json={})

		self.tags.add("123456", "test@example.com", "Foo Tag")

		assert adapter.last_request.json() == {
			"tags": [{"name": "Foo Tag", "status": "active"}]
		}

		self.tags.add("123456", "test@example.com", ["Foo Tag", "Bar Tag"])

		assert adapter.last_request.json() == {
			"tags": [{
				"name": "Foo Tag",
				"status": "active"
			}, {
				"name": "Bar Tag",
				"status": "active"
			}]
		}

	def test_get(self, requests_mock):
		json_payload = {
			"tags": [{
				"id": 123,
				"name": "Foo Tag",
				"date_added": "2018-09-28 22:51:25"
			}, {
				"id": 456,
				"name": "Bar Tag",
				"date_added": "2018-09-25 22:29:59"
			}],
			"total_items": 5
		}

		requests_mock.get(self._construct_endpoint("test@example.com"), json=json_payload)

		assert self.tags.get("123456", "test@example.com") == json_payload

	def test_delete(self, requests_mock):
		adapter = requests_mock.post(self._construct_endpoint("test@example.com"), json={})

		self.tags.delete("123456", "test@example.com", "Foo Tag")

		assert adapter.last_request.json() == {
			"tags": [{"name": "Foo Tag", "status": "inactive"}]
		}

		self.tags.delete("123456", "test@example.com", ["Foo Tag", "Bar Tag"])

		assert adapter.last_request.json() == {
			"tags": [{
				"name": "Foo Tag",
				"status": "inactive"
			}, {
				"name": "Bar Tag",
				"status": "inactive"
			}]
		}


def test_find_best_email_for_user_primary(user):
	EmailAddress.objects.add_email(None, user, "address1@example.com")
	email2 = EmailAddress.objects.add_email(None, user, "address2@example.com")

	email2.set_as_primary()

	assert find_best_email_for_user(user) == email2


def test_find_best_email_for_user_no_primary(user):
	email1 = EmailAddress.objects.add_email(None, user, "address1@example.com")
	EmailAddress.objects.add_email(None, user, "address2@example.com")

	assert find_best_email_for_user(user) == email1


def test_find_best_email_for_user_no_emails(user):
	assert find_best_email_for_user(user) is None


def test_get_mailchimp_subscription_status_true(user):
	user.settings = {"email": {"marketing": True}}
	assert get_mailchimp_subscription_status(user) == "subscribed"


def test_get_mailchimp_subscription_status_false(user):
	user.settings = {"email": {"marketing": False}}
	assert get_mailchimp_subscription_status(user) == "unsubscribed"


def test_get_mailchimp_subscription_status_missing(user):
	user.settings = {}
	assert get_mailchimp_subscription_status(user) == "unsubscribed"
	user.settings = {"email": {}}
	assert get_mailchimp_subscription_status(user) == "unsubscribed"
