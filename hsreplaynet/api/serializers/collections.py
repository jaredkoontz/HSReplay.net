from rest_framework.serializers import IntegerField, Serializer


class CollectionRequestSerializer(Serializer):
	account_hi = IntegerField()
	account_lo = IntegerField()
