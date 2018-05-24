import pytest
from django.db.models import signals
from djstripe.signals import on_delete_subscriber_purge_customer

from hearthsim.identity.accounts.models import User
from hsreplaynet.games.models import GameReplay, GlobalGame
from hsreplaynet.web.views.dashboard import DeleteAccountView, DeleteReplaysView


@pytest.fixture
def disconnect_post_delete():
	signals.pre_delete.disconnect(receiver=on_delete_subscriber_purge_customer, sender=User)


@pytest.fixture
@pytest.mark.django_db
def user():
	return User.objects.create_user(
		username="test", email="test@example.com", password="password")


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
