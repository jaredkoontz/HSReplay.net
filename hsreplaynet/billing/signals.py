from allauth.account.signals import email_changed
from django.db.models.signals import post_save
from django.dispatch import receiver
from djpaypal.models import webhooks as djpaypal_webhooks
from djstripe import webhooks as djstripe_webhooks

from hsreplaynet.analytics.processing import enable_premium_accounts_for_users_in_redshift
from hsreplaynet.utils.instrumentation import error_handler

from .utils import check_for_referrals


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


@djpaypal_webhooks.webhook_handler("billing.subscription.*")
def sync_premium_accounts_for_paypal_subscription(sender, event, **kwargs):
	subscription = event.get_resource()
	if subscription.user and subscription.user.is_premium:
		check_for_referrals(subscription.user)
		enable_premium_accounts_for_users_in_redshift([subscription.user])


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
