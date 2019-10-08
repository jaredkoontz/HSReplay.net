from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..serializers.billing import UserPaymentSerializer


class TransactionHistoryView(APIView):
	serializer_class = UserPaymentSerializer
	authentication_classes = [SessionAuthentication]
	permission_classes = [IsAuthenticated]

	def get(self, request):
		serializer = self.serializer_class(request.user)
		return Response(serializer.data["payments"])
