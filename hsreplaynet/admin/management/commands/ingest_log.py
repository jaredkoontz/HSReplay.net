import json

from django.core.files import File
from django.core.management.base import BaseCommand, CommandError
from django.utils.timezone import now

from hearthsim.identity.accounts.models import User
from hsreplaynet.uploads.models import UploadEvent


class Command(BaseCommand):
	def add_arguments(self, parser):
		parser.add_argument("file", nargs="+")
		group = parser.add_mutually_exclusive_group(required=False)
		group.add_argument(
			"--force-attach", type=str, metavar="USERNAME",
			help="User to attach the resulting replays to."
		)
		group.add_argument(
			"--pick-token", type=str, metavar="USERNAME",
			help="Pick a token for the user to attach to."
		)

	def handle(self, *args, **options):
		if options["force_attach"]:
			user = User.objects.get(username=options["force_attach"])
			if not user:
				raise CommandError(f"User {repr(options['force_attach'])} not found")
		else:
			user = None

		if options["pick_token"]:
			user = User.objects.get(username=options["pick_token"])
			if not user:
				raise CommandError(f"User {repr(options['pick_token'])} not found")
			token = user.auth_tokens.first()
		else:
			token = None

		for file in options["file"]:
			self.stdout.write(f"Uploading {repr(file)}")
			metadata = {
				"build": 0,
				"match_start": now().isoformat(),
			}

			event = UploadEvent(
				upload_ip="127.0.0.1",
				metadata=json.dumps(metadata),
				token_uuid=token.key if token else None,
			)

			event.file = file
			event.save()

			with open(file, "r") as f:
				event.file = File(f)
				event.save()

			event.process()
			self.stdout.write("%r: %s" % (event, event.get_absolute_url()))

			if event.game:
				if user:
					# only overwrite user if forced (via --username)
					event.game.user = user
					event.game.save()
				self.stdout.write("%r: %s" % (event.game, event.game.get_absolute_url()))
				self.stdout.write("Replay: %s" % (event.game.replay_xml.url))
