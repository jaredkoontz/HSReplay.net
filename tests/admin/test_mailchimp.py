from datetime import timedelta

from django.test import override_settings
from django.utils import timezone
from djpaypal.models import BillingAgreement
from djstripe.enums import PlanInterval
from djstripe.models import Customer, Plan, Subscription

from hsreplaynet.admin.mailchimp import (
	AbandonedCartTag, HearthstoneDeckTrackerUserTag,
	HSReplayNetUserTag, MailChimpTag, PremiumSubscriberTag
)


class TestMailChimpTag:

	def setup_method(self):
		self.tag = MailChimpTag("Test Tag 1.2")

	def test_names(self):
		assert self.tag.name == "Test Tag 1.2"
		assert self.tag.tag_group_name == "mailchimp:test-tag-12"

	def test_add_user_to_tag_group_new(self, user):
		assert self.tag.add_user_to_tag_group(user)
		assert user in self.tag.tag_group.user_set.all()

	def test_add_user_to_tag_group_existing(self, user):
		self.tag.tag_group.user_set.add(user)

		assert self.tag.add_user_to_tag_group(user) is False
		assert user in self.tag.tag_group.user_set.all()

	def test_remove_user_from_tag_group_new(self, user):
		assert self.tag.remove_user_from_tag_group(user) is False
		assert user not in self.tag.tag_group.user_set.all()

	def test_remove_user_from_tag_group_existing(self, user):
		self.tag.tag_group.user_set.add(user)

		assert self.tag.remove_user_from_tag_group(user)
		assert user not in self.tag.tag_group.user_set.all()


class TestHSReplayNetUserTag:

	def setup_method(self):
		self.tag = HSReplayNetUserTag()

	def test_should_apply_to_true(self, user):
		user.last_site_activity = timezone.now()
		assert self.tag.should_apply_to(user)

	def test_should_apply_to_false(self, user):
		user.last_site_activity = None
		assert self.tag.should_apply_to(user) is False
		user.last_site_activity = timezone.now() - timedelta(days=35)
		assert self.tag.should_apply_to(user) is False


class TestHearthstoneDeckTrackerUserTag:

	def setup_method(self):
		self.tag = HearthstoneDeckTrackerUserTag()

	def test_should_apply_to_true(self, user):
		user.last_replay_upload = timezone.now()
		assert self.tag.should_apply_to(user)

	def test_should_apply_to_false(self, user):
		user.last_replay_upload = None
		assert self.tag.should_apply_to(user) is False
		user.last_replay_upload = timezone.now() - timedelta(days=35)
		assert self.tag.should_apply_to(user) is False


class TestPremiumSubscriberTag:

	def setup_method(self):
		self.tag = PremiumSubscriberTag()

	@override_settings(PREMIUM_OVERRIDE=None)
	def test_should_apply_to_true_stripe(self, user):
		customer = Customer.objects.create(
			stripe_id="cust_TEST",
			account_balance=0,
			delinquent=False,
			subscriber=user
		)
		plan = Plan.objects.create(
			stripe_id="plan_TEST",
			amount=0,
			currency="USD",
			interval=PlanInterval.month
		)
		subscription = Subscription(
			current_period_end=timezone.now() + timedelta(days=7),
			current_period_start=timezone.now() - timedelta(days=7),
			customer=customer,
			quantity=1,
			plan=plan,
			start=timezone.now() - timedelta(days=7),
			status="active"
		)
		subscription.save()

		user.djstripe_customers.add(customer)

		assert self.tag.should_apply_to(user)

	@staticmethod
	def _create_billing_agreement(user, state):
		billingagreement = BillingAgreement(
			agreement_details={"last_payment_date": timezone.now().isoformat()},
			livemode=True,
			payer={},
			plan={
				"payment_definitions": [{
					"frequency": "Month",
					"frequency_interval": 1,
					"type": "REGULAR"
				}]
			},
			shipping_address={},
			start_date=timezone.now(),
			state=state,
			user=user
		)
		billingagreement.save()
		return billingagreement

	@override_settings(PREMIUM_OVERRIDE=None)
	def test_should_apply_to_true_paypal_active(self, user):
		self._create_billing_agreement(user, "Active")
		assert self.tag.should_apply_to(user)

	@override_settings(PREMIUM_OVERRIDE=None)
	def test_should_apply_to_true_paypal_canceled(self, user):
		self._create_billing_agreement(user, "Canceled")
		assert self.tag.should_apply_to(user)

	@override_settings(PREMIUM_OVERRIDE=None)
	def test_should_apply_to_false(self, user):
		assert self.tag.should_apply_to(user) is False


class TestAbandonedCartTag:

	def setup_method(self):
		self.tag = AbandonedCartTag()

	def test_should_apply_to_true(self, user):
		user.last_premium_checkout = timezone.now() - timedelta(minutes=90)
		assert self.tag.should_apply_to(user)

	def test_should_apply_to_false(self, user):
		user.last_premium_checkout = None
		assert self.tag.should_apply_to(user) is False
		user.last_premium_checkout = timezone.now() - timedelta(minutes=30)
		assert self.tag.should_apply_to(user) is False
