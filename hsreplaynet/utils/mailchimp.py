from django.conf import settings
from mailchimp3 import MailChimp
from mailchimp3.baseapi import BaseApi
from mailchimp3.helpers import check_subscriber_hash


class ListMemberTags(BaseApi):
	"""Retrieve tags for a specific list member"""

	def __init__(self, *args, **kwargs):
		"""Initialize the endpoint"""

		super(ListMemberTags, self).__init__(*args, **kwargs)
		self.endpoint = "lists"

	def add(self, list_id, subscriber_hash, data):
		"""Add one or more tags to a specified list subscriber.

		:param list_id: The unique id for the list.
		:param subscriber_hash: The MD5 hash of the lowercase version of the member’s email
		:param data: The tag(s) to add, as either a string or list of strings
		"""

		subscriber_hash = check_subscriber_hash(subscriber_hash)

		if isinstance(data, str):
			tag_names = [dict(name=data, status="active")]
		elif isinstance(data, list):
			tag_names = list(map(lambda t: dict(name=t, status="active"), data))
		else:
			raise ValueError("Tags must be given as a string or list of strings")

		# noinspection PyProtectedMember
		return self._mc_client._post(
			url=self._build_path(list_id, "members", subscriber_hash, "tags"),
			data=dict(tags=tag_names)
		)

	def get(self, list_id, subscriber_hash):
		"""Get the tags for a specified list subscriber.

		:param list_id: The unique id for the list.
		:param subscriber_hash: The MD5 hash of the lowercase version of the member’s email
		"""

		subscriber_hash = check_subscriber_hash(subscriber_hash)

		# noinspection PyProtectedMember
		return self._mc_client._get(
			url=self._build_path(list_id, "members", subscriber_hash, "tags")
		)

	def delete(self, list_id, subscriber_hash, data):
		"""Remove one or more tags from a specified list subscriber.

		:param list_id: The unique id for the list.
		:param subscriber_hash: The MD5 hash of the lowercase version of the member’s email
		:param data: The tag(s) to remove, as either a string or list of strings
		"""

		subscriber_hash = check_subscriber_hash(subscriber_hash)

		if isinstance(data, str):
			tag_names = [dict(name=data, status="inactive")]
		elif isinstance(data, list):
			tag_names = list(map(lambda t: dict(name=t, status="inactive"), data))
		else:
			raise ValueError("Tags must be given as a string or list of strings")

		# noinspection PyProtectedMember
		return self._mc_client._post(
			url=self._build_path(list_id, "members", subscriber_hash, "tags"),
			data=dict(tags=tag_names)
		)


if hasattr(settings, "MAILCHIMP_API_KEY") and hasattr(settings, "MAILCHIMP_LIST_KEY_ID"):
	_client = MailChimp(mc_api=settings.MAILCHIMP_API_KEY)
	_client.lists.members.tags = ListMemberTags(_client)
else:
	_client = None


def get_mailchimp_client():
	"""Return a configured instance of the MailChimp API client."""

	if _client is not None:
		return _client
	else:
		raise RuntimeError("MAILCHIMP_API_KEY and MAILCHIMP_LIST_KEY_ID must be set.")


def find_best_email_for_user(user):
	"""Returns the "best" EmailAddress associated with the specified User

	...where "best" is the first EmailAddress marked primary, or the first EmailAddress
	overall if there is no primary address.

	:param user: The user for whom to find the best email address
	:return: The best EmailAddress or None if the user has no EmailAddresses
	"""

	addresses = list(user.emailaddress_set.all())
	addresses.sort(key=lambda a: a.pk)

	target_address = None

	for address in addresses:
		if target_address is None or address.primary:
			target_address = address

	return target_address


def get_mailchimp_subscription_status(user):
	"""Return a MailChimp subscription status for the user based on their email settings.

	:param user: The target user
	:return: True if the user has specifically enabled marketing emails, False otherwise
	"""

	email_settings = user.settings.get("email", {})
	return "subscribed" if email_settings.get("marketing", False) else "unsubscribed"
