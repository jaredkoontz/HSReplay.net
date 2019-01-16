from datetime import date, datetime

import pytz
from dateutil import parser
from django.core.management.base import BaseCommand, CommandError
from djstripe.models import Coupon, Plan

from hsreplaynet.features.models import Feature, FeatureInvite


class Command(BaseCommand):
	help = "Generate multiple invites at once with the same parameters."

	def add_arguments(self, parser):
		parser.add_argument(
			"--count", type=int, required=True,
			help="Number of invites to generate."
		)
		parser.add_argument(
			"--feature", action="append", default=[],
			help="Feature group to add the redeemer to. Can be repeated."
		)
		parser.add_argument(
			"--subscribe_to", nargs="?",
			help="Stripe plan to subscribe the redeemer to."
		)
		parser.add_argument(
			"--coupon", nargs="?",
			help="Stripe coupon to apply to the redeemers account."
		)
		parser.add_argument(
			"--max-uses", type=int, default=1,
			help="Maximum redemptions per invite."
		)
		parser.add_argument(
			"--expires",
			help="Expiry timestamp for each invite."
		)
		parser.add_argument(
			"--description", nargs="?",
			help="A humand readable description for the invites."
		)
		parser.add_argument(
			"--noinput", action="store_true",
			help="Skip confirmation step."
		)

	def handle(self, *args, **options):
		count = options["count"]
		if count < 1:
			raise CommandError("count needs to be 1 or greater")

		self.stdout.write("Preparing to generate %s invite(s)" % count)

		description = options["description"]
		if description is None:
			description = "Created on %s" % date.today()

		max_uses = options["max_uses"]
		if max_uses == 0:
			raise CommandError("Unlimited max_uses are intentionally disabled")
		if max_uses < 1:
			raise CommandError("max_uses need to be 1 or greater")

		features = []
		for _feature in options["feature"]:
			try:
				features.append(Feature.objects.get(name=_feature))
			except Feature.DoesNotExist as e:
				raise CommandError('%s ("%s")' % (e, _feature))

		_subscribe_to = options["subscribe_to"]
		if _subscribe_to:
			try:
				subscribe_to = Plan.objects.get(stripe_id=_subscribe_to)
			except Plan.DoesNotExist as e:
				raise CommandError(e)
		else:
			subscribe_to = None

		_coupon = options["coupon"]
		if _coupon:
			try:
				coupon = Coupon.objects.get(stripe_id=_coupon)
			except Coupon.DoesNotExist as e:
				raise CommandError(e)
		else:
			coupon = None

		_expires = options["expires"]
		if _expires:
			try:
				expires = parser.parse(_expires)
			except ValueError as e:
				raise CommandError("%s (--expires)" % e)
			if not expires.tzinfo:
				expires = expires.replace(tzinfo=pytz.utc)
			if expires <= datetime.now(tz=pytz.utc):
				raise CommandError("--expires needs to be in the future")
		else:
			expires = None

		# preview
		if not options["noinput"]:
			self.stdout.write("Please check these parameter are correct:")

		self.stdout.write("-" * 36)
		self.stdout.write("code:         <generated>")
		self.stdout.write('description:  "%s"' % description)

		pretty_features = "none"
		if len(features) > 0:
			pretty_features = "%r" % features
		self.stdout.write("features:     %s" % pretty_features)

		pretty_subscribe_to = "nothing"
		if subscribe_to:
			pretty_subscribe_to = "%r" % subscribe_to
		self.stdout.write("subscribe_to: %s" % pretty_subscribe_to)

		pretty_coupon = coupon if coupon else "none"
		self.stdout.write("coupon:       %s" % pretty_coupon)

		pretty_max_uses = "unlimited" if max_uses is 0 else "%d (per invite)" % max_uses
		self.stdout.write("max_uses:     %s" % pretty_max_uses)

		self.stdout.write("expires:      %s" % ("never" if expires is None else expires))
		self.stdout.write("-" * 36)

		# confirmation step
		if not options["noinput"]:
			if input("Generate %d invites like this? [y/N] " % count).lower() != "y":
				raise CommandError("Not creating invites.")

		self.stdout.write("Generating invites...")

		for i in range(count):
			invite = FeatureInvite(
				description=description,
				subscribe_to=subscribe_to,
				coupon=coupon.stripe_id if coupon else "",
				expires=expires,
				max_uses=max_uses
			)
			invite.save()
			for _feature in features:
				invite.features.add(_feature)

			self.stdout.write(f"https://hsreplay.net{invite.get_absolute_url()}")

		self.stdout.write("Done")
