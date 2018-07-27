from rest_framework import serializers
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK, HTTP_400_BAD_REQUEST
from rest_framework.views import APIView

from hsreplaynet.admin.models import AdUnit


class AdUnitSerializer(serializers.Serializer):
	enabled = serializers.BooleanField()

	def save(self):
		ad_unit, _ = AdUnit.objects.get_or_create(name=self.context["name"])
		ad_unit.enabled = self.validated_data["enabled"]
		ad_unit.save()


class AdUnitView(APIView):
	authentication_classes = (SessionAuthentication, )
	permission_classes = (IsAdminUser, )
	serializer_class = AdUnitSerializer

	def patch(self, request, **kwargs):
		context = {
			"name": kwargs["name"]
		}
		serializer = self.serializer_class(data=request.data, context=context)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data, status=HTTP_200_OK)
		return Response(serializer.errors, status=HTTP_400_BAD_REQUEST)
