from oauth2_provider.contrib.rest_framework import (
	OAuth2Authentication, TokenHasResourceScope
)
from rest_framework.mixins import CreateModelMixin, ListModelMixin, RetrieveModelMixin
from rest_framework.viewsets import GenericViewSet

from hsreplaynet.webhooks.models import WebhookEndpoint

from ..permissions import IsOwnerOrStaff
from ..serializers.webhooks import WebhookSerializer


class WebhookViewSet(CreateModelMixin, ListModelMixin, RetrieveModelMixin, GenericViewSet):
	authentication_classes = (OAuth2Authentication, )
	permission_classes = (IsOwnerOrStaff, TokenHasResourceScope)
	queryset = WebhookEndpoint.objects.filter(is_deleted=False)
	serializer_class = WebhookSerializer
	required_scopes = ["webhooks"]

	def get_queryset(self):
		queryset = super().get_queryset()
		user = self.request.user
		if not user.is_authenticated:
			return queryset.none()
		return queryset.filter(user=user)
