from django.core.exceptions import ObjectDoesNotExist
from oauth2_provider.contrib.rest_framework import OAuth2Authentication
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from hearthsim.identity.oauth2.permissions import OAuth2HasScopes
from hsreplaynet.settings import S3_COLLECTIONS_BUCKET
from hsreplaynet.utils.aws.clients import S3

from ..serializers.collections import CollectionRequestSerializer


class CollectionURLPresigner(APIView):
	authentication_classes = (SessionAuthentication, OAuth2Authentication)
	permission_classes = (OAuth2HasScopes(read_scopes=["collections:read"], write_scopes=[]), )
	serializer_class = CollectionRequestSerializer

	def get(self, request, **kwargs):
		serializer = self.serializer_class(data=request.GET)
		serializer.is_valid(raise_exception=True)
		try:
			account = request.user.blizzard_accounts.get(
				account_hi=serializer.validated_data["account_hi"],
				account_lo=serializer.validated_data["account_lo"],
			)
		except ObjectDoesNotExist:
			raise ValidationError({"detail": "Account hi/lo not found for user."})

		key = f"collections/{account.account_hi}/{account.account_lo}/collection.json"
		content_type = "application/json"
		url = self.get_presigned_url(key, content_type)
		return Response({
			"method": "PUT",
			"url": url,
			"content_type": content_type,
			"account_hi": account.account_hi,
			"account_lo": account.account_lo,
		})

	def get_presigned_url(self, key: str, content_type: str, expires: int=60 * 3) -> str:
		return S3.generate_presigned_url("put_object", Params={
			"Bucket": S3_COLLECTIONS_BUCKET,
			"Key": key,
			"ContentType": content_type,
		}, ExpiresIn=expires, HttpMethod="PUT")
