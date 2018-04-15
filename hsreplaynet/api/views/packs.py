from oauth2_provider.contrib.rest_framework import OAuth2Authentication
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import ValidationError
from rest_framework.mixins import CreateModelMixin, ListModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from hearthsim.identity.accounts.models import BlizzardAccount
from hsreplaynet.api.legacy import AuthTokenAuthentication
from hsreplaynet.packs.models import Pack

from ..serializers.packs import PackSerializer


class PackViewSet(CreateModelMixin, ListModelMixin, GenericViewSet):
	authentication_classes = (
		SessionAuthentication, OAuth2Authentication, AuthTokenAuthentication
	)
	permission_classes = (IsAuthenticated, )
	queryset = Pack.objects.all()
	serializer_class = PackSerializer

	def list(self, request):
		region = request.GET.get("region")
		account_lo = request.GET.get("account_lo")
		blizzard_account = BlizzardAccount.objects.filter(
			user=request.user, region=region, account_lo=account_lo
		)
		if blizzard_account.count() != 1:
			raise ValidationError("Could not determine Blizzard Account")

		queryset = self.queryset.filter(blizzard_account=blizzard_account.get())
		serializer = self.serializer_class(queryset, many=True)

		return Response(serializer.data)
