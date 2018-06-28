from oauth2_provider.contrib.rest_framework import OAuth2Authentication, TokenHasScope
from rest_framework import views
from rest_framework.response import Response

from .permissions import PartnerStatsPermission


class PartnerStatsView(views.APIView):
	authentication_classes = (OAuth2Authentication, )
	permission_classes = (PartnerStatsPermission, TokenHasScope)
	required_scopes = ["stats.partner:read"]


class ExampleView(PartnerStatsView):
	def get(self, request, format=None):
		content = {
			"Hello": "World!"
		}
		return Response(content)
