from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
	def add_arguments(self, parser):
		parser.add_argument("user", nargs=1)

	def handle(self, *args, **options):
		username = options["user"]
		User = get_user_model()

		try:
			user = User.objects.get(username=username[0])
		except User.DoesNotExist as e:
			raise CommandError(e)

		if input("Delete all replays for user %r? [y/N] " % (user)).lower() != "y":
			raise CommandError("Will not delete replays.")
			return

		user.delete_replays()

		self.stdout.write("Replays have been deleted.")
