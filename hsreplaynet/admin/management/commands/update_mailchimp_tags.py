from django.conf import settings
from django.core.management import BaseCommand
from mailchimp3.helpers import get_subscriber_hash

from hearthsim.identity.accounts.models import User
from hsreplaynet.admin.mailchimp import (
	HearthstoneDeckTrackerUserTag, HSReplayNetUserTag, PremiumSubscriberTag
)
from hsreplaynet.utils.influx import influx_metric
from hsreplaynet.utils.mailchimp import (
	find_best_email_for_user, get_mailchimp_client, get_mailchimp_subscription_status
)


# Set of tags to update.

TAGS = [
	HSReplayNetUserTag(),
	HearthstoneDeckTrackerUserTag(),
	PremiumSubscriberTag()
]


class Command(BaseCommand):
	help = "Update local state of MailChimp tags; optionally push changes to MailChimp API"

	def add_arguments(self, parser):
		parser.add_argument("--publish-remote", action="store_true", default=False)

	@staticmethod
	def _publish_tag_changes(user, email_str, tags_to_add, tags_to_remove):
		list_key_id = settings.MAILCHIMP_LIST_KEY_ID
		email_hash = get_subscriber_hash(email_str)

		client = get_mailchimp_client()

		# We may never have seen this user's email address before or sent it to MailChimp,
		# so do a defensive subscriber creation.

		try:
			client.lists.members.create_or_update(
				list_key_id,
				email_hash, {
					"email_address": email_str,
					"status_if_new": get_mailchimp_subscription_status(user)
				})

			influx_metric("mailchimp_requests", {"count": 1}, method="create_or_update")

			# Tell MailChimp to add any tags that we added locally.

			if len(tags_to_add) > 0:
				client.lists.members.tags.add(
					list_key_id,
					email_hash,
					map(lambda tag: tag.name, tags_to_add)
				)

				influx_metric("mailchimp_requests", {"count": 1}, method="add_tags")

			# Tell MailChimp to remove any tags that we removed locally.

			if len(tags_to_remove) > 0:
				client.lists.members.tags.delete(
					list_key_id,
					email_hash,
					map(lambda tag: tag.name, tags_to_remove)
				)

				influx_metric("mailchimp_requests", {"count": 1}, method="delete_tags")

		except Exception as e:
			print("Failed to contact MailChimp API: %s" % e)

	@staticmethod
	def _percent_mod_10(user_count, total_users):
		return user_count / total_users * 100 % 10

	def handle(self, *args, **options):
		users = User.objects.filter(is_active=True)

		total_users = users.count()

		print(f"Updating MailChimp tags for {total_users} user(s).")

		user_count = 0
		users_with_tag_changes = 0
		mailchimp_api_requests = 0

		for user in users:
			pct_before = self._percent_mod_10(user_count, total_users)
			user_count += 1
			pct_after = self._percent_mod_10(user_count, total_users)

			if pct_before != pct_after:
				print(f"Working... {pct_after}% complete.")

			email = find_best_email_for_user(user)
			if email:
				tags_to_add = []
				tags_to_remove = []
				needs_publish = False

				for tag in TAGS:
					if tag.should_apply_to(user):
						if tag.add_user_to_tag_group(user):
							tags_to_add.append(tag)
							needs_publish = True
					else:
						if tag.remove_user_from_tag_group(user):
							tags_to_remove.append(tag)
							needs_publish = True

				if needs_publish:
					users_with_tag_changes += 1

					if options["publish_remote"]:
						self._publish_tag_changes(
							user,
							email.email,
							tags_to_add,
							tags_to_remove
						)

						# We'll always make at least one request to the API to create the
						# user...

						mailchimp_api_requests += 1

						# ...plus a request if tags were added...

						if len(tags_to_add) > 0:
							mailchimp_api_requests += 1

						# ...plus a request if tags were removed.

						if len(tags_to_remove) > 0:
							mailchimp_api_requests += 1

		print("Done.")
		print(f"Updated tags for {users_with_tag_changes} user(s).")
		print(f"Executed {mailchimp_api_requests} request(s) to MailChimp API.")
