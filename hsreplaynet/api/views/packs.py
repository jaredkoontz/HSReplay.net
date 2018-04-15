from oauth2_provider.contrib.rest_framework import OAuth2Authentication
from rest_framework.authentication import SessionAuthentication
from rest_framework.mixins import CreateModelMixin, RetrieveModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import GenericViewSet

from hsreplaynet.api.legacy import AuthTokenAuthentication
from hsreplaynet.packs.models import Pack

from ..serializers.packs import PackSerializer


class PackViewSet(CreateModelMixin, RetrieveModelMixin, GenericViewSet):
	authentication_classes = (
		SessionAuthentication, OAuth2Authentication, AuthTokenAuthentication
	)
	permission_classes = (IsAuthenticated, )
	queryset = Pack.objects.all()
	serializer_class = PackSerializer
