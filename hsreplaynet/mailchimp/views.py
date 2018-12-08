from allauth.account.models import EmailAddress
from django.conf import settings
from django.http import HttpResponse
from django.views import View
from rest_framework.status import HTTP_200_OK, HTTP_403_FORBIDDEN

from hsreplaynet.utils.influx import influx_metric


class MailchimpWebhookView(View):
	"""Request handlers for webhook callbacks from Mailchimp."""

	@staticmethod
	def _unsubscribe(request):

		email = request.POST["data[email]"]

		try:
			email_address = EmailAddress.objects.get(email=email)
			user = email_address.user
			user_exists = True

			# If the user exists, update their marketing contact preference.

			if "email" in user.settings:
				user.settings["email"]["marketing"] = False
				user.save()

		except EmailAddress.DoesNotExist:
			user_exists = False

		influx_metric(
			"mailchimp_webhook_request",
			{"value": 1},
			reason=request.POST.get("data[reason]"),
			type="unsubscribe",
			user_exists=user_exists
		)

	def _handle_request(self, request):

		# Ensure that we're being called back with our secret key.

		if request.GET.get("key") != settings.MAILCHIMP_WEBHOOK_KEY:
			return HttpResponse(status=HTTP_403_FORBIDDEN)

		event_type = request.POST.get("type")

		if event_type == "unsubscribe" and request.POST.get("data[action]") == "unsub":
			self._unsubscribe(request)
		elif event_type:
			influx_metric("mailchimp_webhook_request", {"value": 1}, type=event_type)

		return HttpResponse(status=HTTP_200_OK)

	def get(self, request):
		return self._handle_request(request)

	def post(self, request):
		return self._handle_request(request)
