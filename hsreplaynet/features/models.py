import re
from datetime import datetime
from enum import IntEnum
from uuid import uuid4

from django.conf import settings
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator
from django.db import models
from django.dispatch.dispatcher import receiver
from django.urls import reverse
from django.utils.timezone import now
from django_intenum import IntEnumField
from shortuuid import ShortUUID


class FeatureError(Exception):
	pass


class FeatureStatus(IntEnum):
	"""
	A Feature can be in any of the following states:

	- OFF: This is intended for when a feature is failing in production. It
	provides a mechanism for preventing that code from executing that can be activated
	even faster then doing a deploy with a fix or doing something ad-hoc to quiet the
	problem.

	- STAFF_ONLY: The only people who can ever see a feature with this status are the staff
	users. This status will usually be used as a temporary status when a problem arises.
	The "STAFF_ONLY" status allows us to temporarily take away a feature from users without
	needing to pull people out of any of their groups. "STAFF_ONLY" is also the default
	result that template tags and API decorators return if they are unable to reach the
	DB or find the feature in the DB for any reason.

	- AUTHORIZED_ONLY: The default status that features start in.  When a new feature is
	created in the database a new group for that feature is automatically created. For
	example, if the feature name is "winrates" then the group name will be "feature:winrates".
	Any user who is made a member of that group will then be able to see the feature when it
	has the AUTHORIZED_ONLY status.

	- LOGGED_IN_USERS: Features that are public for everyone except anonymous users.

	- PUBLIC: Features that are public are rendered even for anonymous users. This
	status is the final resting status for any features that are offered for free once the
	development is complete.
	"""

	OFF = 0
	STAFF_ONLY = 1
	AUTHORIZED_ONLY = 2
	LOGGED_IN_USERS = 3
	PUBLIC = 4


class Feature(models.Model):
	"""
	A Feature is any logical chunk of functionality whose visibility should be
	determined at runtime based on the context of the current user. The status of a
	feature and the rules that govern whether it is rendered are determined by the
	FeatureStatus enum that is defined above.

	The read_only flag is a flag that always defaults to False but can be set true
	temporarily when maintenance needs to be done to the database. In order for this to
	work, ALL operations that write to or mutate the database in any way must be wrapped in
	a feature tag or a feature decorator, and they must implement graceful behavior and
	feedback to users when they are operating in read_only mode.

	For version 2 of a released feature, a new feature tag should be created that is named
	appropriately to indicate it is a new version. It's status lifecycle should be
	managed in the usual way for new features, independently of the previous version's
	status.
	"""

	name = models.CharField(max_length=255, null=False, unique=True)
	description = models.TextField(blank=True)
	created = models.DateTimeField(auto_now_add=True)
	status = IntEnumField(enum=FeatureStatus, default=FeatureStatus.OFF)
	read_only = models.BooleanField(default=False)
	rollout_percent = models.PositiveIntegerField(
		default=100,
		validators=[MaxValueValidator(100)],
		help_text=(
			"This may be set to a value lower than 100 to further restrict "
			"the user pool with access to this feature."
		)
	)

	def __str__(self):
		return self.name

	def is_user_part_of_rollout(self, user) -> bool:
		if user.is_authenticated:
			base = user.pk
		else:
			base = id(user)

		offset = int(self.created.microsecond / 10000)
		return (base + offset) % 100 <= self.rollout_percent

	def enabled_for_user(self, user) -> bool:
		if self.status == FeatureStatus.OFF:
			return False

		if self.status == FeatureStatus.STAFF_ONLY:
			return user.is_superuser or user.is_staff

		if self.status == FeatureStatus.AUTHORIZED_ONLY:
			return user.groups.filter(name=self.authorized_group_name).exists()

		if not self.is_user_part_of_rollout(user):
			return user.groups.filter(name=self.authorized_group_name).exists()

		if self.status == FeatureStatus.LOGGED_IN_USERS:
			return user.is_authenticated

		if self.status == FeatureStatus.PUBLIC:
			return True

		return False

	def add_user_to_authorized_group(self, user) -> bool:
		group = self.authorized_group
		if group not in user.groups.all():
			user.groups.add(self.authorized_group)
			return True
		return False

	def remove_user(self, user) -> bool:
		group = self.authorized_group
		if group in user.groups.all():
			user.groups.remove(self.authorized_group)
			return True
		return False

	@property
	def authorized_group_name(self) -> str:
		return f"feature:{self.name}:preview"

	@property
	def authorized_group(self):
		return Group.objects.get(name=self.authorized_group_name)


class Redeemable():
	@property
	def is_valid(self) -> bool:
		raise NotImplementedError

	def redeem_for_user(self, user) -> bool:
		raise NotImplementedError


class FeatureInviteManager(models.Manager):
	def get_redeemable_by_code(self, code) -> Redeemable:
		try:
			invite = self.get(uuid=code)
		except (FeatureInvite.DoesNotExist, ValidationError):
			pass
		else:
			return invite

		try:
			alias_code = re.sub(r"\s", "", code)  # strip whitespaces
			alias = FeatureInviteAlias.objects.get(code=alias_code)
		except FeatureInviteAlias.DoesNotExist:
			pass
		else:
			return alias

		raise FeatureInvite.DoesNotExist


class FeatureInvite(models.Model, Redeemable):
	"""
	Represents an invitation to one or more feature tags.
	"""

	uuid = models.UUIDField(primary_key=True, editable=False, default=uuid4)
	objects = FeatureInviteManager()
	features = models.ManyToManyField(Feature, related_name="invites", blank=True)
	use_count = models.PositiveIntegerField(
		default=0, editable=False,
		help_text="The amount of times this invitation has been successfully used."
	)
	max_uses = models.PositiveIntegerField(default=0, help_text="0 for unlimited")
	expires = models.DateTimeField(
		blank=True, null=True, help_text="No longer valid after this date."
	)
	subscribe_to = models.ForeignKey(
		"djstripe.Plan", on_delete=models.SET_NULL, null=True, blank=True,
		help_text="Auto subscribe to this Stripe Plan"
	)
	coupon = models.CharField(max_length=500, blank=True, help_text="Redeem a Stripe Coupon")
	description = models.TextField(blank=True)

	created = models.DateTimeField(auto_now_add=True)
	modified = models.DateTimeField(auto_now=True)

	def __str__(self):
		if self.coupon:
			return "Coupon for %r" % (self.coupon)
		if self.subscribe_to:
			return "Subscription to %r" % (str(self.subscribe_to))
		features = self.features.all()
		if len(features):
			return "Invitation to %s" % (", ".join(str(f) for f in features))
		return "Empty invite"

	@property
	def is_valid(self):
		if self.max_uses and self.use_count >= self.max_uses:
			return False

		if self.expires and now() > self.expires:
			return False

		return True

	def get_absolute_url(self):
		return reverse("redeem_code_pretty", kwargs={"code": str(self.uuid)})

	def redeem_for_user(self, user):
		if not self.is_valid:
			self.delete()
			raise FeatureError("Invitation is no longer valid.")

		redeemed = 0
		for feature in self.features.all():
			if feature.add_user_to_authorized_group(user):
				redeemed += 1

		if self.subscribe_to:
			customer = user.stripe_customer

			if not customer.valid_subscriptions.filter(plan=self.subscribe_to):
				# XXX: Not try-catching the following block
				customer.subscribe(self.subscribe_to.stripe_id)
				redeemed += 1

		if self.coupon:
			r = self.redeem_coupon(user)
			if r:
				redeemed += 1

		if redeemed:
			# The invite is only considered redeemed if it had any effect
			self.use_count += 1
			self.save()

		if not self.is_valid:
			self.delete()

		return bool(redeemed)

	def redeem_coupon(self, user):
		from djstripe.models import Coupon

		if not self.coupon:
			return False

		try:
			coupon = Coupon.objects.get(stripe_id=self.coupon)
		except Coupon.DoesNotExist:
			return False

		customer = user.stripe_customer
		if customer.coupon == coupon:
			return False

		try:
			customer.add_coupon(coupon)
		except Exception:
			return False

		return True


def get_coupon_code():
	uuid = ShortUUID(alphabet="ACDEFJKLMNPRTUVWXY3479")
	return uuid.random(length=12)


class FeatureInviteAlias(models.Model, Redeemable):
	"""
	Represents a short code referencing a FeatureInvite.
	This allows handing out shorter codes, handing out multiple codes for a single feature,
	and also auditible codes.
	"""
	code = models.CharField(
		max_length=32, null=False, blank=False, unique=True, default=get_coupon_code
	)
	invite = models.ForeignKey(
		"features.FeatureInvite", on_delete=models.SET_NULL, blank=True, null=True
	)
	redeemed_on = models.DateTimeField(blank=True, null=True)
	redeemed_by = models.ForeignKey(
		settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True
	)

	def __str__(self):
		return self.code

	@property
	def is_valid(self):
		if self.redeemed:
			return False
		invite = self.invite
		if not invite:
			return False
		return self.invite.is_valid

	@property
	def redeemed(self):
		return self.redeemed_on is not None

	def redeem_for_user(self, user):
		if self.redeemed:
			raise FeatureInviteAlreadyRedeemedError("Code has already been redeemed")

		if not self.invite:
			raise FeatureInviteNotActivated("Code has not been activated")

		if not self.is_valid:
			raise FeatureError("Code is not valid")

		try:
			redemption = FeatureInviteAlias.objects.get(invite=self.invite, redeemed_by_id=user.id)
			if redemption:
				raise FeatureInviteNotApplicable("Code is not applicable for this user")
		except FeatureInviteAlias.DoesNotExist:
			pass

		redeemed = self.invite.redeem_for_user(user)
		if redeemed:
			self.redeemed_on = datetime.now()
			self.redeemed_by = user
			self.save()

		return bool(redeemed)

	class Meta:
		verbose_name = "Feature invite alias"
		verbose_name_plural = "Feature invite aliases"


class FeatureInviteAlreadyRedeemedError(FeatureError):
	pass


class FeatureInviteNotApplicable(FeatureError):
	pass


class FeatureInviteNotActivated(FeatureError):
	pass


@receiver(models.signals.post_save, sender=Feature)
def create_feature_membership_groups(sender, instance, **kwargs):
	Group.objects.get_or_create(name=instance.authorized_group_name)
