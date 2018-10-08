from datetime import timedelta
from unittest.mock import PropertyMock, patch

from django.utils import timezone

from hearthsim.identity.accounts.models import User
from hsreplaynet.admin.mailchimp import (
	AbandonedCartTag, HearthstoneDeckTrackerUserTag,
	HSReplayNetUserTag, MailChimpTag, PremiumSubscriberTag
)


class TestMailChimpTag:

	def setup_method(self):
		self.tag = MailChimpTag("Test Tag 1.2")

	def test_names(self):
		assert self.tag.name == "Test Tag 1.2"
		assert self.tag.tag_group_name == "mailchimp:test-tag-12"

	def test_add_user_to_tag_group_new(self, user):
		assert self.tag.add_user_to_tag_group(user)
		assert user in self.tag.tag_group.user_set.all()

	def test_add_user_to_tag_group_existing(self, user):
		self.tag.tag_group.user_set.add(user)

		assert self.tag.add_user_to_tag_group(user) is False
		assert user in self.tag.tag_group.user_set.all()

	def test_remove_user_from_tag_group_new(self, user):
		assert self.tag.remove_user_from_tag_group(user) is False
		assert user not in self.tag.tag_group.user_set.all()

	def test_remove_user_from_tag_group_existing(self, user):
		self.tag.tag_group.user_set.add(user)

		assert self.tag.remove_user_from_tag_group(user)
		assert user not in self.tag.tag_group.user_set.all()


class TestHSReplayNetUserTag:

	def setup_method(self):
		self.tag = HSReplayNetUserTag()

	def test_should_apply_to_true(self, user):
		user.last_site_activity = timezone.now()
		assert self.tag.should_apply_to(user)

	def test_should_apply_to_false(self, user):
		user.last_site_activity = None
		assert self.tag.should_apply_to(user) is False
		user.last_site_activity = timezone.now() - timedelta(days=35)
		assert self.tag.should_apply_to(user) is False


class TestHearthstoneDeckTrackerUserTag:

	def setup_method(self):
		self.tag = HearthstoneDeckTrackerUserTag()

	def test_should_apply_to_true(self, user):
		user.last_replay_upload = timezone.now()
		assert self.tag.should_apply_to(user)

	def test_should_apply_to_false(self, user):
		user.last_replay_upload = None
		assert self.tag.should_apply_to(user) is False
		user.last_replay_upload = timezone.now() - timedelta(days=35)
		assert self.tag.should_apply_to(user) is False


class TestPremiumSubscriberTag:

	def setup_method(self):
		self.tag = PremiumSubscriberTag()

	def test_should_apply_to_true(self, user):
		with patch.object(User, "is_premium", new_callable=PropertyMock) as premium_user:
			premium_user.return_value = True
			assert self.tag.should_apply_to(user)

	def test_should_apply_to_false(self, user):
		with patch.object(User, "is_premium", new_callable=PropertyMock) as free_user:
			free_user.return_value = False
			assert self.tag.should_apply_to(user) is False


class TestAbandonedCartTag:

	def setup_method(self):
		self.tag = AbandonedCartTag()

	def test_should_apply_to_true(self, user):
		user.last_premium_checkout = timezone.now() - timedelta(minutes=90)
		assert self.tag.should_apply_to(user)

	def test_should_apply_to_false(self, user):
		user.last_premium_checkout = None
		assert self.tag.should_apply_to(user) is False
		user.last_premium_checkout = timezone.now() - timedelta(minutes=30)
		assert self.tag.should_apply_to(user) is False
