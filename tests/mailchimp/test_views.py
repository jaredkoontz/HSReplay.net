import pytest
from allauth.account.models import EmailAddress
from django.test import override_settings


PAYLOAD = {
	"type": "unsubscribe",
	"data[action]": "unsub",
	"data[reason]": "manual",
	"data[id]": "abcdef",
	"data[list_id]": "123456",
	"data[email]": "test@hearthsim.net",
}


class TestMailchimpWebhookView:

	@pytest.mark.django_db
	@override_settings(MAILCHIMP_WEBHOOK_KEY="123")
	def test_unsubscribe_unauthorized(self, client):
		response = client.post(
			"/mailchimp/webhook/?key=456",
			data=PAYLOAD
		)

		assert response.status_code == 403

	@pytest.mark.django_db
	@override_settings(MAILCHIMP_WEBHOOK_KEY="123")
	def test_unsubscribe(self, client, user):
		email = EmailAddress(user=user, email=user.email)
		email.save()

		user.settings["email"] = {"marketing": True}
		user.save()

		payload = {**PAYLOAD, "data[email]": user.email}
		response = client.post("/mailchimp/webhook/?key=123", data=payload)

		user.refresh_from_db()

		assert not user.settings["email"]["marketing"]
		assert response.status_code == 200

	@pytest.mark.django_db
	@override_settings(MAILCHIMP_WEBHOOK_KEY="123")
	def test_unsubscribe_no_such_user(self, client):
		response = client.post(
			"/mailchimp/webhook/?key=123",
			data=PAYLOAD
		)

		assert response.status_code == 200
