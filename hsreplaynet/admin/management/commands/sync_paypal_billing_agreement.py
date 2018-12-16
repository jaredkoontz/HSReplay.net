from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from djpaypal.models import BillingAgreement


class Command(BaseCommand):
	help = "Sync the PayPal billing agreement for a given user"

	def add_arguments(self, parser):
		parser.add_argument("--username", nargs=1)

	def handle(self, *args, **options):
		username = options["username"][0]
		User = get_user_model()

		try:
			user = User.objects.get(username=username)
		except User.DoesNotExist as e:
			raise CommandError(e)

		for agreement in BillingAgreement.objects.filter(user=user):
			print("Syncing %s..." % agreement.id)
			BillingAgreement.find_and_sync(agreement.id)

		print("Done")
