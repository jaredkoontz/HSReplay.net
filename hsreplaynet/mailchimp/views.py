from allauth.account.models import EmailAddress
from django.conf import settings
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from rest_framework.status import HTTP_200_OK, HTTP_403_FORBIDDEN

from hsreplaynet.utils.influx import influx_metric
from hsreplaynet.utils.mailchimp import find_best_email_for_user


@method_decorator(csrf_exempt, name="dispatch")
class MailchimpWebhookView(View):
	"""Request handlers for webhook callbacks from Mailchimp."""

	@staticmethod
	def _unsubscribe(request):

		email = request.POST["data[email]"]

		try:
			email_address = EmailAddress.objects.get(email=email)
			user = email_address.user
			user_exists = True
			primary_email = find_best_email_for_user(user)

			# If the user exists and the subscription update was related to their primary
			# email address, update their marketing contact preference. (We don't want to
			# update the preference if their non-primary email address was unsubscribed,
			# because that won't really reflect the actual state of their preference.)

			if "email" in user.settings and primary_email and primary_email.email == email:
				user.settings["email"]["marketing"] = False
				user.save()

		except EmailAddress.DoesNotExist:
			user_exists = False
			primary_email = False

		influx_metric(
			"mailchimp_webhook_request",
			{"value": 1},
			reason=request.POST.get("data[reason]"),
			type="unsubscribe",
			user_exists=user_exists
		)

	@staticmethod
	def _subscribe(request):

		email = request.POST["data[email]"]

		try:
			email_address = EmailAddress.objects.get(email=email)
			user = email_address.user
			user_exists = True
			primary_email = find_best_email_for_user(user)

			# If the user exists and the subscription webhook was about their primary email,
			# update their marketing contact preference to reflect that.

			if primary_email and primary_email.email == email:
				if "email" not in user.settings:
					user.settings["email"] = {"marketing": True}
				else:
					user.settings["email"]["marketing"] = True

				user.save()

		except EmailAddress.DoesNotExist:
			user_exists = False
			primary_email = False

		influx_metric(
			"mailchimp_webhook_request",
			{"value": 1},
			type="subscribe",
			user_exists=user_exists
		)

	def _handle_request(self, request):

		# Ensure that we're being called back with our secret key.

		if request.GET.get("key") != settings.MAILCHIMP_WEBHOOK_KEY:
			return HttpResponse(status=HTTP_403_FORBIDDEN)

		event_type = request.POST.get("type")

		if event_type == "unsubscribe" and request.POST.get("data[action]") == "unsub":
			self._unsubscribe(request)
		elif event_type == "subscribe":
			self._subscribe(request)
		elif event_type:
			influx_metric("mailchimp_webhook_request", {"value": 1}, type=event_type)

		return HttpResponse(status=HTTP_200_OK)

	def get(self, request):
		return self._handle_request(request)

	def post(self, request):
		return self._handle_request(request)
