from allauth.account.models import EmailAddress
from allauth.account.signals import email_changed
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver
from django_bouncy.models import Bounce
from django_bouncy.signals import feedback
from djpaypal.models import webhooks as djpaypal_webhooks
from djstripe import webhooks as djstripe_webhooks
from mailchimp3.helpers import get_subscriber_hash

from hsreplaynet.admin.mailchimp import PremiumSubscriberTag
from hsreplaynet.analytics.processing import enable_premium_accounts_for_users_in_redshift
from hsreplaynet.utils import log
from hsreplaynet.utils.influx import influx_metric
from hsreplaynet.utils.instrumentation import error_handler
from hsreplaynet.utils.mailchimp import (
	find_best_email_for_user, get_mailchimp_client, get_mailchimp_subscription_status
)

from .utils import check_for_referrals


# Convenience function to share tag-adding behavior between Premium Subscriptions acquired
# via Stripe or PayPal.

def _update_mailchimp_tags_for_premium_subscriber(user):
	email = find_best_email_for_user(user)

	if email:
		tag = PremiumSubscriberTag()
		if tag.should_apply_to(user) and tag.add_user_to_tag_group(user):

			client = get_mailchimp_client()
			list_key_id = settings.MAILCHIMP_LIST_KEY_ID
			email_hash = get_subscriber_hash(email.email)

			# At this point we have no idea whether the user's email address is already
			# registered with MailChimp, so do a defensive create-or-update to make sure
			# it's on the list before we give them the premium tag.

			try:
				client.lists.members.create_or_update(
					list_key_id,
					email_hash, {
						"email_address": email.email,
						"status_if_new": get_mailchimp_subscription_status(user),
					}
				)

				influx_metric("mailchimp_requests", {"count": 1}, method="create_or_update")

				# ...then assign the premium tag.

				client.lists.members.tags.add(list_key_id, email_hash, tag.name)
				influx_metric("mailchimp_requests", {"count": 1}, method="add_tags")

			except Exception as e:
				log.warning("Failed to contact MailChimp API: %s" % e)
				influx_metric("mailchimp_request_failures", {"count": 1})


@djstripe_webhooks.handler("customer.subscription.created")
def sync_premium_accounts_for_stripe_subscription(event, **kwargs):
	if event.customer and event.customer.subscriber:
		user = event.customer.subscriber
		check_for_referrals(user)
		enable_premium_accounts_for_users_in_redshift([user])

		if event.customer.active_subscriptions.count() > 1:
			try:
				raise RuntimeError(
					"Customer %r (%r) has multiple subscriptions!" % (user, event.customer.stripe_id)
				)
			except Exception as e:
				error_handler(e)

		_update_mailchimp_tags_for_premium_subscriber(user)


@djpaypal_webhooks.webhook_handler("billing.subscription.*")
def sync_premium_accounts_for_paypal_subscription(sender, event, **kwargs):
	subscription = event.get_resource()
	if subscription.user and subscription.user.is_premium:
		check_for_referrals(subscription.user)
		enable_premium_accounts_for_users_in_redshift([subscription.user])
		_update_mailchimp_tags_for_premium_subscriber(subscription.user)


@djpaypal_webhooks.webhook_handler("payment.sale.completed")
def sync_premium_accounts_for_paypal_sale(sender, event, **kwargs):
	sale = event.get_resource()
	ba = sale.billing_agreement
	if ba and ba.user and ba.user.is_premium:
		check_for_referrals(ba.user)
		enable_premium_accounts_for_users_in_redshift([ba.user])
		_update_mailchimp_tags_for_premium_subscriber(ba.user)


@receiver(post_save, sender=djpaypal_webhooks.WebhookEventTrigger)
def on_paypal_webhook_error(sender, instance, **kwargs):
	if instance.exception:
		try:
			raise Exception("%s - %s" % (instance.exception, instance.id))
		except Exception as e:
			error_handler(e)


@receiver(email_changed)
def on_email_changed(request, user, from_email_address, to_email_address, **kwargs):
	from djstripe.models import Customer
	customer = Customer.objects.filter(subscriber=user).first()
	if not customer:
		# Don't bother creating a customer for this user, it'll happen later.
		return

	stripe_obj = customer.api_retrieve()
	stripe_obj.email = to_email_address.email
	Customer.sync_from_stripe_data(stripe_obj.save())


@receiver(email_changed)
def add_address_to_mailchimp(request, user, from_email_address, to_email_address, **_):
	"""Signal handler for the email_changed event to add or update emails in MailChimp"""

	client = get_mailchimp_client()

	try:
		if from_email_address:

			# If there was a previous email address, we may (or may not) have added it to
			# our list in MailChimp already, along with zero or more tags. So let's try to
			# update it via the subscriber hash of the _previous_ address and update the
			# email address to the _new_ address.

			client.lists.members.create_or_update(
				settings.MAILCHIMP_LIST_KEY_ID,
				get_subscriber_hash(from_email_address.email), {
					"email_address": to_email_address.email,
					"status_if_new": get_mailchimp_subscription_status(user)
				}
			)

			influx_metric("mailchimp_requests", {"count": 1}, method="create_or_update")

		else:

			# But if there was no previous primary address, just add a new list member.

			client.lists.members.create(settings.MAILCHIMP_LIST_KEY_ID, {
				"email_address": to_email_address.email,
				"status": get_mailchimp_subscription_status(user)
			})

			influx_metric("mailchimp_requests", {"count": 1}, method="create")

	except Exception as e:
		log.warning("Failed to contact MailChimp API: %s" % e)
		influx_metric("mailchimp_request_failures", {"count": 1})


@receiver(feedback, sender=Bounce)
def process_feedback(sender, **kwargs):
	bounce = kwargs["instance"]

	if bounce.hard:
		User = get_user_model()
		User.objects.filter(email__iexact=bounce.address).update(email="")
		EmailAddress.objects.filter(email__iexact=bounce.address).delete()
