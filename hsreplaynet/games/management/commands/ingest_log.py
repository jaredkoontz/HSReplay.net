import json

from django.core.files import File
from django.core.management.base import BaseCommand
from django.utils.timezone import now

from hearthsim.identity.accounts.models import AuthToken, User
from hsreplaynet.uploads.models import UploadEvent


class Command(BaseCommand):
	def add_arguments(self, parser):
		parser.add_argument("file", nargs="+")
		group = parser.add_mutually_exclusive_group(required=False)
		group.add_argument(
			"--token", type=str, metavar="AUTH_TOKEN",
			help=" ".join((
				"Auth token for the upload event.",
				"Will attach replays to owning user and fire webhooks.",
			))
		)
		group.add_argument(
			"--pick-token", type=str, metavar="USERNAME",
			help="User to pick an auth token from. Will attach token like --token."
		)
		group.add_argument(
			"--force-attach", type=str, metavar="USERNAME",
			help=" ".join((
				"User to attach the resulting replays to.",
				"Will only attach after processing, so webhooks will not fire.",
				"Use --pick-token instead.",
			))
		)

	def handle(self, *args, **options):
		raw_token = options["token"]
		pick_token_username = options["pick_token"]
		force_attach_username = options["force_attach"]
		if raw_token:
			user = None
			token = AuthToken.objects.get(key=raw_token)
			if not token:
				raise Exception("Auth token not found")
		elif pick_token_username:
			user = User.objects.get(username=pick_token_username)
			# pick the user's first token
			token = user.auth_tokens.first()
			if token:
				self.stdout.write(
					"Picked auth token %s (owned by %s)" % (token, token.user)
				)
			else:
				raise Exception("No auth token found")
			# should already be attached by token
			user = None
		elif force_attach_username:
			user = User.objects.get(username=force_attach_username)
			if not user:
				raise Exception("User not found")
			self.stdout.write(" ".join((
				"Warning: Will only attach to user after processing and not fire webhooks.",
				"Use --pick-token instead.",
			)))
			token = None
		else:
			user = None
			token = None

		for file in options["file"]:
			print("Uploading %r" % (file))
			metadata = {
				"build": 0,
				"match_start": now().isoformat(),
			}

			event = UploadEvent(
				upload_ip="127.0.0.1",
				metadata=json.dumps(metadata),
				token_uuid=token.key,
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
