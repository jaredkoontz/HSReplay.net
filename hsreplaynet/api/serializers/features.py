from rest_framework.serializers import CharField, Serializer


class RedeemCodeSerializer(Serializer):
	code = CharField(required=True, max_length=36)
