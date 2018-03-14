from rest_framework.exceptions import ValidationError
from rest_framework.serializers import IntegerField, Serializer


class CollectionRequestSerializer(Serializer):
	account_hi = IntegerField(required=False)
	account_lo = IntegerField()
	region = IntegerField(required=False)

	def validate(self, data):
		data = super().validate(data)
		if "account_hi" not in data and "region" not in data:
			raise ValidationError({
				"account_hi": ["One of `account_hi` or `region` must be specified."],
				"region": ["One of `account_hi` or `region` must be specified."],
			})

		return data
