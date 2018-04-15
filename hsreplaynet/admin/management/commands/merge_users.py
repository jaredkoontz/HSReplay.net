from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from djstripe.models import Customer

from hsreplaynet.utils import log


def merge_users(base_user, user):
	"""
	Merge user into base_user
	"""
	def do_queryset(qs, **kwargs):
		if not kwargs:
			kwargs = {"user": base_user}
		ret = qs.update(**kwargs)
		log.info("Merging %r -> %r: %r", user, base_user, ret)
		return ret

	# Auth tokens
	do_queryset(user.auth_tokens)

	# Replays
	do_queryset(user.replays)

	# Packs
	do_queryset(user.packs)

	# Comments
	do_queryset(user.comment_comments)
	do_queryset(user.comment_flags)

	# Blizzard Accounts
	do_queryset(user.blizzard_accounts)

	# Emails
	if base_user.emailaddress_set.filter(primary=True).count():
		user.emailaddress_set.update(primary=False)
	do_queryset(user.emailaddress_set)

	# OAuth2
	do_queryset(user.oauth2_application)
	do_queryset(user.oauth2_provider_accesstoken)
	do_queryset(user.oauth2_provider_refreshtoken)
	do_queryset(user.oauth2_provider_grant)

	# Social accounts
	do_queryset(user.socialaccount_set)

	# Webhooks
	do_queryset(user.webhook_endpoints)

	# Stripe customers

	# Always delete livemode customers
	Customer.objects.filter(livemode=False, subscriber=user).delete()

	customers = Customer.objects.filter(livemode=True)
	user_has_customer = customers.filter(subscriber=user).exists()
	base_user_has_customer = customers.filter(subscriber=base_user).exists()

	if user_has_customer and base_user_has_customer:
		cus1 = customers.get(subscriber=user)
		cus2 = customers.get(subscriber=base_user)
		log.warn("Found customers for both users: %r and %r. Merge manually!", cus1, cus2)
	elif user_has_customer:
		cus = customers.get(subscriber=user)
		log.info("Moving Customer %r from user %r to user %r", cus, user, base_user)
		cus.subscriber = base_user
		cus.metadata["django_account"] = str(base_user.pk)
		cus.save()
	elif base_user_has_customer:
		log.info("Found Stripe customer on %r, nothing to do.", base_user)
	else:
		log.info("No Stripe customers to merge.")

	# dj-paypal
	do_queryset(user.paypal_payers)
	do_queryset(user.preparedbillingagreement_set)
	do_queryset(user.billingagreement_set)


class Command(BaseCommand):
	def add_arguments(self, parser):
		parser.add_argument("base_user", nargs=1)
		parser.add_argument("user", nargs=1)

	def handle(self, *args, **options):
		base_username = options["base_user"]
		username = options["user"]
		User = get_user_model()

		try:
			base_user = User.objects.get(username=base_username[0])
			user = User.objects.get(username=username[0])
		except User.DoesNotExist as e:
			raise CommandError(e)

		if input("Merge user %r into %r? [y/N] " % (user, base_user)).lower() != "y":
			raise CommandError("Not merging users.")
			return

		merge_users(base_user, user)

		self.stdout.write("Users have been merged.")
