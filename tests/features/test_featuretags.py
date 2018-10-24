import pytest
from rest_framework.response import Response
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework.views import APIView

from hsreplaynet.api.permissions import UserHasFeature
from hsreplaynet.features.models import Feature, FeatureStatus


class PermissionTestAPIView(APIView):
	permission_classes = (UserHasFeature("test-feature"), )

	def get(self, request, format=None):
		return Response({"test": "OK"})


permission_test_api_view = PermissionTestAPIView.as_view()


@pytest.mark.django_db
def test_user_has_feature_api_permission(user):
	factory = APIRequestFactory()
	request = factory.get("/")
	force_authenticate(request, user=user)

	feature = Feature(
		name="test-feature",
		status=FeatureStatus.AUTHORIZED_ONLY
	)
	feature.save()

	response = permission_test_api_view(request, format="json")
	assert response.status_code == 403
	assert response.data != {"test": "OK"}

	# add user to feature group and try again
	feature.add_user_to_authorized_group(user)
	response = permission_test_api_view(request, format="json")
	assert response.status_code == 200
	assert response.data == {"test": "OK"}
