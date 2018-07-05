from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from oauth2_provider.admin import AccessToken
from oauth2_provider.models import get_application_model
from oauthlib import common

from hsreplaynet.api.partner.permissions import FEATURE
from hsreplaynet.features.models import Feature, FeatureStatus


class Command(BaseCommand):
	help = "Grant a partner's user access to the Partner API and a long-lived access token."

	def add_arguments(self, parser):
		parser.add_argument(
			"user",
			help="The partner's user account name."
		)

		parser.add_argument(
			"--reuse-application", action="store", type=int,
			help="The numeric id of a preexisting application."
		)

		parser.add_argument(
			"--scope", action="store",
			default="stats.partner:read",
			help="The scope to grant the access token."
		)

		parser.add_argument(
			"--noinput", "--no-input", action="store_true",
			help="Skip confirmation step."
		)

	def handle(self, *args, **options):
		User = get_user_model()
		username = options["user"]
		try:
			user = User.objects.get(username=username)
		except User.DoesNotExist as e:
			raise CommandError(e)

		Application = get_application_model()

		application = None
		if options["reuse_application"]:
			application_id = options["reuse_application"]
			try:
				application = Application.objects.get(pk=application_id)
			except Application.DoesNotExist as e:
				raise CommandError(e)

			if application.user is not None and application.user != user:
				raise CommandError("Application is not owned by user")

		scope = options["scope"]

		if application:
			application_scopes = application.allowed_scopes.split(" ")
			if scope not in application_scopes:
				raise CommandError("The application does not allow the scope")

		expires = timezone.now() + timedelta(days=365 * 100)

		# confirmation step
		if not options["noinput"]:
			if application:
				msg = 'Create partner access token for "%s" using application "%s"?' % (
					str(user), str(application)
				)
			else:
				msg = 'Create new application and partner access token for "%s"?' % (
					str(user)
				)
			if input("%s [y/N] " % msg).lower() != "y":
				raise CommandError("Aborted")

		with transaction.atomic():
			feature, created = Feature.objects.get_or_create(
				name=FEATURE,
				defaults={
					"status": FeatureStatus.AUTHORIZED_ONLY,
				}
			)

			# the group should have been automatically created
			group = Group.objects.get(name=feature.authorized_group_name)

			user.groups.add(group)
			user.save()

			if not application:
				application = Application(
					name="%s's Partner Stats API" % user.username,
					user=user,
					allowed_scopes=scope,
				)
				application.save()

			access_token = AccessToken(
				user=user,
				scope=scope,
				expires=expires,
				token=common.generate_token(),
				application=application
			)
			access_token.save()

		self.stdout.write("Created access token %s" % str(access_token.token))

		self.stdout.write("Done")
