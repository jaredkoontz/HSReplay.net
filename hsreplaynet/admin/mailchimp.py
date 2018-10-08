from datetime import timedelta

from django.contrib.auth.models import Group
from django.utils import timezone


class MailChimpTag:
	"""A local representation of a MailChimp Tag applied to an HSReplay.net user.

	MailChimpTags are implemented on top of Django groups, using "mailchimp:" as a kind of
	group namespace prefix.
	"""

	def __init__(self, name):
		"""Constructor.

		:param name: The name of the Tag as it should appear on MailChimp
		"""

		self.name = name

		# Create a "slug" version of the tag name appropriate for use as a Django group
		# name.

		self._tag_name = name.lower().replace(" ", "-").replace(".", "")

	def __str__(self):
		return self.name

	def add_user_to_tag_group(self, user) -> bool:
		"""Add the specified user to group represented by this tag.

		:param user: The user to add
		:return: True if the user was not already present in the group, False otherwise
		"""

		group = self.tag_group
		if group not in user.groups.all():
			user.groups.add(self.tag_group)
			return True
		return False

	def remove_user_from_tag_group(self, user) -> bool:
		"""Remove the specified user from the group represented by this tag.

		:param user: The user to remove
		:return: True if the user was present in the group, False otherwise
		"""

		group = self.tag_group
		if group in user.groups.all():
			user.groups.remove(self.tag_group)
			return True
		return False

	@property
	def tag_group_name(self) -> str:
		return f"mailchimp:{self._tag_name}"

	@property
	def tag_group(self):
		group, created = Group.objects.get_or_create(name=self.tag_group_name)
		return group

	def should_apply_to(self, user):
		"""A predicate to determine whether this tag should apply to the specified User."""

		raise NotImplemented()


class HSReplayNetUserTag(MailChimpTag):
	"""A MailChimpTag implementation to represent users who are active on HSReplay.net.

	...where "active" is defined as having visited the site within the past 30 days.
	"""

	def __init__(self):
		super().__init__("HSReplay.net User")

	def should_apply_to(self, user):
		return (
			user.last_site_activity is not None and
			user.last_site_activity > timezone.now() - timedelta(days=30)
		)


class HearthstoneDeckTrackerUserTag(MailChimpTag):
	"""A MailChimpTag implementation to represent users who are active deck tracker users.

	...where "active" is defined as having uploaded a replay from Hearthstone Deck Tracker
	or HSTracker within the past 30 days.
	"""

	def __init__(self):
		super().__init__("HDT User")

	def should_apply_to(self, user):
		return (
			user.last_replay_upload is not None and
			user.last_replay_upload > timezone.now() - timedelta(days=30)
		)


class PremiumSubscriberTag(MailChimpTag):
	"""A MailChimpTag implementation to represent active premium subscribers."""

	def __init__(self):
		super().__init__("Premium Subscriber")

	def should_apply_to(self, user):
		return user.is_premium


class AbandonedCartTag(MailChimpTag):
	"""MailChimpTag implementation for users who abandoned the premium checkout process.

	...meaning that they didn't complete the premium purchase process (which nulls out the
	"last_premium_checkout" fields in their user record within an hour of beginning the
	checkout process.
	"""

	def __init__(self):
		super().__init__("Abandoned Cart")

	def should_apply_to(self, user):
		return (
			user.last_premium_checkout is not None and
			user.last_premium_checkout < timezone.now() - timedelta(hours=1)
		)
