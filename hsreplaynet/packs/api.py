from rest_framework import serializers
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import ValidationError
from rest_framework.mixins import CreateModelMixin, RetrieveModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import GenericViewSet

from hsreplaynet.api.legacy import AuthTokenAuthentication

from .models import Pack, PackCard


CARDS_PER_PACK = 5


class PackCardSerializer(serializers.ModelSerializer):
	premium = serializers.BooleanField(default=False)

	class Meta:
		fields = ("card", "premium")
		model = PackCard


class PackSerializer(serializers.HyperlinkedModelSerializer):
	id = serializers.IntegerField(read_only=True)
	account_hi = serializers.IntegerField(min_value=1)
	account_lo = serializers.IntegerField(min_value=1)
	cards = PackCardSerializer(many=True, write_only=True)

	class Meta:
		model = Pack
		fields = (
			"id", "booster_type", "date", "account_hi", "account_lo", "cards"
		)

	def create(self, validated_data):
		validated_data["user"] = self.context["request"].user
		cards = validated_data.pop("cards")
		if len(cards) != CARDS_PER_PACK:
			raise ValidationError("Packs must contain exactly %r cards" % (CARDS_PER_PACK))
		pack = Pack.objects.create(**validated_data)

		for card in cards:
			PackCard.objects.create(pack=pack, card=card["card"], premium=card["premium"])

		return pack


class PackViewSet(CreateModelMixin, RetrieveModelMixin, GenericViewSet):
	authentication_classes = (SessionAuthentication, AuthTokenAuthentication)
	permission_classes = (IsAuthenticated, )
	queryset = Pack.objects.all()
	serializer_class = PackSerializer
