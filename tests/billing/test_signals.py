from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from allauth.account import signals
from allauth.account.models import EmailAddress
from django.conf import settings
from django.contrib.auth.models import Group
from django.test import override_settings
from djpaypal.models import BillingAgreement, WebhookEvent
from djstripe.models import Customer, Event
from mailchimp3.helpers import get_subscriber_hash

from hsreplaynet.billing.signals import (
	sync_premium_accounts_for_paypal_subscription,
	sync_premium_accounts_for_stripe_subscription
)


MAILCHIMP_TEST_ENDPOINT = "https://test.api.mailchimp.com/3.0/"


def test_add_address_to_mailchimp(requests_mock, user):
	user.settings = {"email": {"marketing": True}}

	email = EmailAddress.objects.add_email(None, user, "test@example.com")
	email.set_as_primary()
	email.save()

	adapter = requests_mock.post(
		MAILCHIMP_TEST_ENDPOINT + "lists/test-list-key-id/members",
		json={
			"id": get_subscriber_hash("test@example.com"),
			"email_address": "test@example.com",
			"unique_email_id": "12345",
			"status": "subscribed",
			"list_id": "test-list-key-id"
		}
	)

	signals.email_changed.send(
		sender=None,
		request=None,
		user=user,
		from_email_address=None,
		to_email_address=email
	)

	assert adapter.last_request.json() == {
		"email_address": "test@example.com",
		"status": "subscribed"
	}


def test_add_address_to_mailchimp_existing(requests_mock, user):
	user.settings = {"email": {"marketing": True}}

	email1 = EmailAddress.objects.add_email(None, user, "oldaddress@example.com")

	email2 = EmailAddress.objects.add_email(None, user, "test@example.com")
	email2.set_as_primary()

	id = get_subscriber_hash("oldaddress@example.com")

	adapter = requests_mock.put(
		MAILCHIMP_TEST_ENDPOINT + "lists/test-list-key-id/members/" + id,
		json={
			"email_address": "test@example.com",
			"unique_email_id": "12345",
			"status": "subscribed",
			"list_id": "test-list-key-id"
		}
	)

	signals.email_changed.send(
		sender=None,
		request=None,
		user=user,
		from_email_address=email1,
		to_email_address=email2
	)

	assert adapter.last_request.json() == {
		"email_address": "test@example.com",
		"status_if_new": "subscribed"
	}


def _create_stripe_customer(user):
	return Customer.objects.create(
		stripe_id="cus_TEST",
		subscriber=user,
		account_balance=0,
		delinquent=False
	)


def _create_stripe_event(user):
	return Event(data={
		"object": {
			"id": "cus_TEST",
			"object": "customer",
			"account_balance": 0,
			"currency": None,
			"delinquent": False,
			"email": EmailAddress.objects.filter(user=user).first().email,
			"metadata": {
				"djstripe_customer": user.id
			}
		}
	})


def _stub_mailchimp_create_or_update(requests_mock, email):
	id = get_subscriber_hash(email)
	return requests_mock.put(
		MAILCHIMP_TEST_ENDPOINT + "lists/test-list-key-id/members/" + id,
		json={
			"id": id,
			"email_address": email,
			"unique_email_id": "12345",
			"status": "subscribed",
			"list_id": "test-list-key-id"
		})


def _stub_stripe_api(requests_mock, stripe_id="cust_TEST"):
	if hasattr(settings, "STRIPE_API_HOST"):
		stub_prefix = settings.STRIPE_API_HOST
	else:
		stub_prefix = "https://api.stripe.com"

	requests_mock.post(stub_prefix + "/v1/customers", json=dict(
		id=stripe_id,
		livemode=True
	))


@override_settings(PREMIUM_OVERRIDE=True)
@patch(
	"hsreplaynet.billing.signals.enable_premium_accounts_for_users_in_redshift",
	lambda x: None
)
def test_sync_premium_accounts_for_stripe_subscription(requests_mock, user):
	user.settings = {"email": {"marketing": True}}
	user.save()

	id = get_subscriber_hash("test@example.com")

	customer = _create_stripe_customer(user)
	EmailAddress.objects.add_email(None, user, "test@example.com")
	event = _create_stripe_event(user)

	_stub_stripe_api(requests_mock, stripe_id=customer.stripe_id)

	members_endpoint = _stub_mailchimp_create_or_update(requests_mock, "test@example.com")
	tag_endpoint = requests_mock.post(
		MAILCHIMP_TEST_ENDPOINT + "lists/test-list-key-id/members/" + id + "/tags", json={}
	)

	sync_premium_accounts_for_stripe_subscription(event)

	assert members_endpoint.last_request.json() == {
		"email_address": "test@example.com",
		"status_if_new": "subscribed"
	}
	assert tag_endpoint.last_request.json() == {
		"tags": [{
			"name": "Premium Subscriber",
			"status": "active"
		}]
	}

	group = Group.objects.get(name="mailchimp:premium-subscriber")
	assert user in group.user_set.all()


@override_settings(PREMIUM_OVERRIDE=True)
@patch(
	"hsreplaynet.billing.signals.enable_premium_accounts_for_users_in_redshift",
	lambda x: None
)
def test_sync_premium_accounts_for_stripe_subscription_existing(requests_mock, user):
	user.settings = {"email": {"marketing": True}}

	id = get_subscriber_hash("test@example.com")

	customer = _create_stripe_customer(user)
	EmailAddress.objects.add_email(None, user, "test@example.com")
	event = _create_stripe_event(user)

	_stub_stripe_api(requests_mock, stripe_id=customer.stripe_id)

	members_endpoint = _stub_mailchimp_create_or_update(requests_mock, "test@example.com")
	tag_endpoint = requests_mock.post(
		MAILCHIMP_TEST_ENDPOINT + "lists/test-list-key-id/members/" + id + "/tags", json={}
	)

	group, created = Group.objects.get_or_create(name="mailchimp:premium-subscriber")
	group.user_set.add(user)

	sync_premium_accounts_for_stripe_subscription(event)

	assert members_endpoint.last_request is None
	assert tag_endpoint.last_request is None


def _create_billing_agreement(user, current_time, end_time):
	return BillingAgreement.objects.create(
		agreement_details={
			"last_payment_date": end_time.isoformat()
		},
		end_of_period=end_time,
		livemode=True,
		payer={},
		plan={
			"payment_definitions": [{
				"type": "REGULAR",
				"frequency": "Month",
				"frequency_interval": 1
			}]
		},
		shipping_address={},
		start_date=current_time,
		state="Active",
		user=user
	)


@override_settings(PREMIUM_OVERRIDE=None)
@patch(
	"hsreplaynet.billing.signals.enable_premium_accounts_for_users_in_redshift",
	lambda x: None
)
def test_sync_premium_accounts_for_paypal_subscription(requests_mock, user):
	user.settings = {"email": {"marketing": True}}
	user.save()

	id = get_subscriber_hash("test@example.com")
	current_time = datetime.now(tz=timezone.utc)

	agreement = _create_billing_agreement(
		user,
		current_time,
		current_time + timedelta(days=100)
	)

	EmailAddress.objects.add_email(None, user, "test@example.com")
	event = WebhookEvent(resource_type="agreement", resource=agreement.__dict__)

	_stub_stripe_api(requests_mock)

	members_endpoint = _stub_mailchimp_create_or_update(requests_mock, "test@example.com")
	tag_endpoint = requests_mock.post(
		MAILCHIMP_TEST_ENDPOINT + "lists/test-list-key-id/members/" + id + "/tags", json={}
	)

	sync_premium_accounts_for_paypal_subscription(None, event)

	assert members_endpoint.last_request.json() == {
		"email_address": "test@example.com",
		"status_if_new": "subscribed"
	}
	assert tag_endpoint.last_request.json() == {
		"tags": [{
			"name": "Premium Subscriber",
			"status": "active"
		}]
	}

	group = Group.objects.get(name="mailchimp:premium-subscriber")
	assert user in group.user_set.all()


@override_settings(PREMIUM_OVERRIDE=None)
@patch(
	"hsreplaynet.billing.signals.enable_premium_accounts_for_users_in_redshift",
	lambda x: None
)
def test_sync_premium_accounts_for_paypal_subscription_existing(requests_mock, user):
	id = get_subscriber_hash("test@example.com")
	current_time = datetime.now(tz=timezone.utc)

	agreement = _create_billing_agreement(
		user,
		current_time,
		current_time + timedelta(days=100)
	)

	EmailAddress.objects.add_email(None, user, "test@example.com")
	event = WebhookEvent(resource_type="agreement", resource=agreement.__dict__)

	_stub_stripe_api(requests_mock)

	members_endpoint = _stub_mailchimp_create_or_update(requests_mock, "test@example.com")
	tag_endpoint = requests_mock.post(
		MAILCHIMP_TEST_ENDPOINT + "lists/test-list-key-id/members/" + id + "/tags", json={}
	)

	group, created = Group.objects.get_or_create(name="mailchimp:premium-subscriber")
	group.user_set.add(user)

	sync_premium_accounts_for_paypal_subscription(None, event)

	assert members_endpoint.last_request is None
	assert tag_endpoint.last_request is None
