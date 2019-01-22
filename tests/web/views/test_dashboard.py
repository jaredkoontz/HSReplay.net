from unittest.mock import Mock

import pytest
from allauth.account.models import EmailAddress
from django.db.models import signals
from djstripe.signals import on_delete_subscriber_purge_customer
from mailchimp3.helpers import get_subscriber_hash
from mailchimp3.mailchimpclient import MailChimpError
from mock import patch

from hearthsim.identity.accounts.models import User
from hsreplaynet.games.models import GameReplay, GlobalGame
from hsreplaynet.web.views.dashboard import DeleteAccountView, DeleteReplaysView


@pytest.fixture
def disconnect_post_delete():
	signals.pre_delete.disconnect(receiver=on_delete_subscriber_purge_customer, sender=User)
	yield
	signals.pre_delete.connect(receiver=on_delete_subscriber_purge_customer, sender=User)


@pytest.fixture
@pytest.mark.django_db
def user():
	return User.objects.create_user(
		username="test", email="test@example.com", is_fake=True, password="password")


class TestDeleteAccountView:

	def _do_post(self, client, settings, user):
		client.force_login(user, backend=settings.AUTHENTICATION_BACKENDS[0])
		return client.post("/account/delete/", {"reason": "multiple-accounts"})

	@pytest.mark.django_db
	@pytest.mark.usefixtures("disconnect_post_delete")
	def test_post(self, client, settings, user):
		response = self._do_post(client, settings, user)

		assert response.status_code == 302
		assert response["Location"] == DeleteAccountView.success_url
		assert User.objects.filter(username="test").count() == 0

	@pytest.mark.django_db
	def test_post_cant_delete(self, client, settings, user):
		user.is_staff = True
		user.save()

		response = self._do_post(client, settings, user)

		assert response.status_code == 302
		assert response["Location"] == "/account/delete/"
		assert User.objects.filter(username="test").count() == 1


class TestDeleteReplaysViewTest:

	@pytest.mark.django_db
	def test_post(self, client, settings, user):
		game = GlobalGame()
		game.save()

		replay = GameReplay(global_game=game, user=user)
		replay.save()

		client.force_login(user, backend=settings.AUTHENTICATION_BACKENDS[0])
		response = client.post("/account/delete/replays/")

		assert response.status_code == 302
		assert response["Location"] == DeleteReplaysView.success_url
		assert User.objects.filter(username="test").count() == 1
		assert GameReplay.objects.filter(user=user, is_deleted=False).count() == 0


class TestEmailPreferencesView:

	@pytest.mark.django_db
	def test_post_marketing_true(self, client, settings, user):
		user.emailaddress_set.add(
			EmailAddress.objects.create(user=user, email="test@example.com")
		)
		client.force_login(user, backend=settings.AUTHENTICATION_BACKENDS[0])
		mock_mailchimp_client = Mock()

		with patch("hsreplaynet.web.views.dashboard.get_mailchimp_client") as get_client:
			get_client.return_value = mock_mailchimp_client
			response = client.post("/account/email/preferences/", {"marketing": "on"})

		assert response.status_code == 302

		create_or_update = mock_mailchimp_client.lists.members.create_or_update
		create_or_update.assert_called_once_with(
			"test-list-key-id",
			get_subscriber_hash("test@example.com"), {
				"email_address": "test@example.com",
				"status_if_new": "subscribed",
				"status": "subscribed"
			})

	@pytest.mark.django_db
	def test_post_marketing_true_compliance(self, client, settings, user):
		user.emailaddress_set.add(
			EmailAddress.objects.create(user=user, email="test@example.com")
		)
		client.force_login(user, backend=settings.AUTHENTICATION_BACKENDS[0])

		mock_mailchimp_client = Mock()
		create_or_update = mock_mailchimp_client.lists.members.create_or_update
		create_or_update.side_effect = MailChimpError({
			"status": 400,
			"title": "Member In Compliance State"
		})

		with patch("hsreplaynet.web.views.dashboard.get_mailchimp_client") as get_client:
			get_client.return_value = mock_mailchimp_client
			response = client.post("/account/email/preferences/", {"marketing": "on"})

		assert response.status_code == 302

		create_or_update.assert_called_once_with(
			"test-list-key-id",
			get_subscriber_hash("test@example.com"), {
				"email_address": "test@example.com",
				"status_if_new": "subscribed",
				"status": "subscribed"
			})

		update = mock_mailchimp_client.lists.members.update
		update.assert_called_once_with(
			"test-list-key-id",
			get_subscriber_hash("test@example.com"), {
				"email_address": "test@example.com",
				"status": "pending"
			})

	@pytest.mark.django_db
	def test_post_marketing_false(self, client, settings, user):
		user.emailaddress_set.add(
			EmailAddress.objects.create(user=user, email="test@example.com")
		)
		client.force_login(user, backend=settings.AUTHENTICATION_BACKENDS[0])
		mock_mailchimp_client = Mock()

		with patch("hsreplaynet.web.views.dashboard.get_mailchimp_client") as get_client:
			get_client.return_value = mock_mailchimp_client
			response = client.post("/account/email/preferences/", {"marketing": "off"})

		assert response.status_code == 302

		create_or_update = mock_mailchimp_client.lists.members.create_or_update
		create_or_update.assert_called_once_with(
			"test-list-key-id",
			get_subscriber_hash("test@example.com"), {
				"email_address": "test@example.com",
				"status_if_new": "unsubscribed",
				"status": "unsubscribed"
			})
