from django.core.management.base import BaseCommand
from djpaypal.models import BillingAgreement
from djstripe.models import Subscription

from hsreplaynet.analytics.processing import enable_premium_accounts_for_users_in_redshift


class Command(BaseCommand):
	def handle(self, *args, **options):
		users = set()

		for subscription in Subscription.objects.active():
			users.add(subscription.customer.subscriber)

		for agreement in BillingAgreement.objects.filter(state="Active"):
			if agreement.user:
				users.add(agreement.user)

		self.stdout.write("Found %i users to sync", len(users))
		enable_premium_accounts_for_users_in_redshift(users)
