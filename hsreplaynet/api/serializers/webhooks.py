from rest_framework import serializers

from hsreplaynet.utils.influx import influx_metric
from hsreplaynet.webhooks.models import WebhookEndpoint

from .accounts import UserSerializer


class WebhookSerializer(serializers.ModelSerializer):
	user = UserSerializer(read_only=True)

	class Meta:
		fields = (
			"uuid", "user", "url", "is_active", "secret", "created", "updated"
		)
		read_only_fields = ("user", )
		model = WebhookEndpoint

	def create(self, validated_data):
		validated_data["user"] = self.context["request"].user
		ret = WebhookEndpoint.objects.create(**validated_data)
		influx_metric("hsreplaynet_webhook_create", {
			"source": "api-oauth2",
			"client_id": self.context["request"].auth.application.client_id,
			"uuid": str(ret.uuid),
		})
		return ret
