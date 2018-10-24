from django.utils.translation import gettext as _
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from hsreplaynet.api.serializers.features import RedeemCodeSerializer
from hsreplaynet.api.throttles import RedeemCodeRateThrottle
from hsreplaynet.features.models import (
	FeatureError, FeatureInvite, FeatureInviteAlreadyRedeemedError, FeatureInviteNotApplicable
)


class RedeemCodeView(APIView):
	serializer_class = RedeemCodeSerializer
	authentication_classes = (SessionAuthentication, )
	throttle_classes = (RedeemCodeRateThrottle, )

	def post(self, request):
		serializer = self.serializer_class(data=request.data)
		serializer.is_valid(raise_exception=True)

		code = serializer.validated_data["code"]
		try:
			invite = FeatureInvite.objects.get_redeemable_by_code(code)
		except FeatureInvite.DoesNotExist:
			return self.fail()

		try:
			modified = invite.redeem_for_user(request.user)
		except FeatureInviteAlreadyRedeemedError:
			return self.fail(_("Code has already been used."))
		except FeatureInviteNotApplicable:
			return self.fail(_("Code does not apply to this account."))
		except FeatureError:
			return self.fail()

		if not modified:
			return self.not_modified()

		return self.success()

	def fail(self, message=_("Code is invalid or has expired.")):
		raise PermissionDenied(message)

	def not_modified(self):
		return self.success(_("Code did not affect this account and remains valid."))

	def success(self, message=_("Code has been applied to your account.")):
		return Response({"detail": message})
