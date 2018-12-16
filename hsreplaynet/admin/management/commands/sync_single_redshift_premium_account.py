from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from hsreplaynet.analytics.processing import enable_premium_accounts_for_users_in_redshift


class Command(BaseCommand):
	help = "Sync the redshift premium state for a given user"

	def add_arguments(self, parser):
		parser.add_argument("--username", nargs=1)

	def handle(self, *args, **options):
		username = options["username"][0]
		User = get_user_model()

		try:
			user = User.objects.get(username=username)
		except User.DoesNotExist as e:
			raise CommandError(e)

		enable_premium_accounts_for_users_in_redshift([user])
