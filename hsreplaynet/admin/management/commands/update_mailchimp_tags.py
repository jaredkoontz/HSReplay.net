from django.conf import settings
from django.core.management import BaseCommand
from django.core.paginator import Paginator
from django.db import transaction
from django.db.models import Count, Prefetch
from djstripe.models import Customer
from mailchimp3.helpers import get_subscriber_hash

from hearthsim.identity.accounts.models import User
from hsreplaynet.admin.mailchimp import (
	AbandonedCartTag, HearthstoneDeckTrackerUserTag, HSReplayNetUserTag, PremiumSubscriberTag
)
from hsreplaynet.utils.influx import influx_metric
from hsreplaynet.utils.mailchimp import (
	find_best_email_for_user, get_mailchimp_client, get_mailchimp_subscription_status
)


# Set of tags to update.

TAGS = [
	AbandonedCartTag(),
	HSReplayNetUserTag(),
	HearthstoneDeckTrackerUserTag(),
	PremiumSubscriberTag()
]


class Command(BaseCommand):
	help = "Update local state of MailChimp tags; optionally push changes to MailChimp API"

	def __init__(self):
		super().__init__()

		self.mailchimp_api_requests = 0
		self.total_users = 0
		self.user_count = 0
		self.users_with_tag_changes = 0

	def add_arguments(self, parser):
		parser.add_argument("--batch-size", type=int)
		parser.add_argument("--publish-remote", action="store_true", default=False)
		parser.add_argument("--verbose", action="store_true", default=False)

	def _publish_tag_changes(
		self,
		user,
		email_str,
		tags_to_add,
		tags_to_remove,
		verbose=False
	):
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
			self.mailchimp_api_requests += 1

			# Tell MailChimp to add any tags that we added locally.

			if len(tags_to_add) > 0:
				tag_names = list(map(lambda tag: tag.name, tags_to_add))
				if verbose:
					print(f"Sending request to add tags {tag_names} to {email_str}")
				client.lists.members.tags.add(list_key_id, email_hash, tag_names)

				influx_metric("mailchimp_requests", {"count": 1}, method="add_tags")
				self.mailchimp_api_requests += 1

			# Tell MailChimp to remove any tags that we removed locally.

			if len(tags_to_remove) > 0:
				tag_names = list(map(lambda tag: tag.name, tags_to_remove))
				if verbose:
					print(f"Sending request to remove tags {tag_names} from {email_str}")
				client.lists.members.tags.delete(list_key_id, email_hash, tag_names)

				influx_metric("mailchimp_requests", {"count": 1}, method="delete_tags")
				self.mailchimp_api_requests += 1

		except Exception as e:
			print("Failed to contact MailChimp API: %s" % e, flush=True)
			influx_metric("mailchimp_request_failures", {"count": 1})

	@staticmethod
	def _percent(user_count, total_users):
		return int(user_count / total_users * 100)

	def _process_page(self, page, options):
		user_tags = []
		for user in page:
			pct_before = self._percent(self.user_count, self.total_users)
			self.user_count += 1
			pct_after = self._percent(self.user_count, self.total_users)

			if pct_before != pct_after:
				print(f"Working... {pct_after}% complete.", flush=True)

			email = find_best_email_for_user(user)
			if email:
				tags_to_add = []
				tags_to_remove = []

				for tag in TAGS:
					if tag.should_apply_to(user):
						tags_to_add.append(tag)
					else:
						tags_to_remove.append(tag)

				user_tags.append((user, email, tags_to_add, tags_to_remove))

		# After we've read all the data from the page, go back and make modifications; this
		# part clears the prefetch cache so it has to happen as a second pass.

		with transaction.atomic():
			for user, email, tags_to_add, tags_to_remove in user_tags:
				mailchimp_tags_to_add = []
				mailchimp_tags_to_remove = []
				needs_publish = False

				for tag in tags_to_add:
					if tag.add_user_to_tag_group(user):
						mailchimp_tags_to_add.append(tag)
						needs_publish = True

				for tag in tags_to_remove:
					if tag.remove_user_from_tag_group(user):
						mailchimp_tags_to_remove.append(tag)
						needs_publish = True

				if needs_publish:
					self.users_with_tag_changes += 1

					if options["publish_remote"]:
						self._publish_tag_changes(
							user,
							email.email,
							mailchimp_tags_to_add,
							mailchimp_tags_to_remove,
							verbose=options["verbose"]
						)

	def handle(self, *args, **options):
		self.total_users = User.objects.prefetch_related("emailaddress_set").annotate(
			count=Count("emailaddress")
		).filter(count__gt=0, is_active=True).count()

		print(
			f"Updating MailChimp tags for {self.total_users} user(s) with email addresses.",
			flush=True
		)

		users = User.objects.prefetch_related(
			"billingagreement_set",
			Prefetch(
				"djstripe_customers",
				queryset=Customer.objects.prefetch_related("subscriptions")
			),
			"emailaddress_set",
			"groups"
		).annotate(
			count=Count("emailaddress")
		).filter(count__gt=0, is_active=True).order_by("id")

		batch_size = options["batch_size"] or max(int(self.total_users / 10), 100)

		paginator = Paginator(users, batch_size)
		for page_num in range(1, paginator.num_pages + 1):
			self._process_page(paginator.page(page_num), options)

		print("Done.")
		print(f"Updated tags for {self.users_with_tag_changes} user(s).")
		print(f"Executed {self.mailchimp_api_requests} request(s) to MailChimp API.")
