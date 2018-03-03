from botocore.exceptions import ClientError
from django.core.exceptions import ObjectDoesNotExist
from oauth2_provider.contrib.rest_framework import OAuth2Authentication
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.status import HTTP_304_NOT_MODIFIED, HTTP_412_PRECONDITION_FAILED
from rest_framework.views import APIView

from hearthsim.identity.accounts.models import BlizzardAccount
from hearthsim.identity.oauth2.permissions import OAuth2HasScopes
from hsreplaynet.settings import S3_COLLECTIONS_BUCKET
from hsreplaynet.utils.aws.clients import S3

from ..serializers.collections import CollectionRequestSerializer


class BaseCollectionView(APIView):
	authentication_classes = (SessionAuthentication, OAuth2Authentication)
	serializer_class = CollectionRequestSerializer

	def get(self, request, **kwargs):
		serializer = self.serializer_class(data=request.GET)
		serializer.is_valid(raise_exception=True)

		if request.user.is_staff:
			accounts = BlizzardAccount.objects
		else:
			accounts = request.user.blizzard_accounts

		try:
			account = accounts.get(
				account_hi=serializer.validated_data["account_hi"],
				account_lo=serializer.validated_data["account_lo"],
			)
		except ObjectDoesNotExist:
			raise ValidationError({"detail": "Account hi/lo not found for user."})

		key = f"collections/{account.account_hi}/{account.account_lo}/collection.json"

		if self.request.auth and not self.request.auth.application.livemode:
			# For non-livemode oauth apps, return a testmode url
			key = "sandbox/" + key

		return self._get_response(account, key)


class CollectionURLPresigner(BaseCollectionView):
	permission_classes = (
		OAuth2HasScopes(read_scopes=["collection:write"], write_scopes=[]),
	)

	def _get_response(self, account, key):
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


class CollectionView(BaseCollectionView):
	permission_classes = (
		OAuth2HasScopes(read_scopes=["collection:read"], write_scopes=[]),
	)

	def _parse_collection_json(self, body, encoding: str) -> dict:
		import gzip
		import json

		if not body:
			return {}

		if encoding == "gzip":
			body = gzip.GzipFile(None, "rb", fileobj=body)

		try:
			return json.load(body)
		except json.decoder.JSONDecodeError:
			return {}

	def _translate_s3_cache_headers(self, headers):
		"""
		Translate Django HTTP_* cache headers to their matching boto3 arguments.
		"""
		ret = {}
		pairs = {
			"HTTP_IF_MATCH": "IfMatch",
			"HTTP_IF_MODIFIED_SINCE": "IfModifiedSince",
			"HTTP_IF_NONE_MATCH": "IfNoneMatch",
			"HTTP_IF_UNMODIFIED_SINCE": "IfUnmodifiedSince",
		}

		for k, v in pairs.items():
			if k in self.request.META:
				ret[v] = self.request.META[k]

		return ret

	def _get_response(self, account, key):
		args = {
			"Bucket": S3_COLLECTIONS_BUCKET,
			"Key": key,
		}
		args.update(self._translate_s3_cache_headers(self.request.META))

		try:
			obj = S3.get_object(Bucket=S3_COLLECTIONS_BUCKET, Key=key)
		except S3.exceptions.NoSuchKey:
			raise NotFound()
		except ClientError as e:
			status_code = e.response.get("ResponseMetadata", {}).get("HTTPStatusCode", 0)
			if status_code in (HTTP_304_NOT_MODIFIED, HTTP_412_PRECONDITION_FAILED):
				return Response(status=status_code)
			else:
				raise

		collection = self._parse_collection_json(obj.get("Body"), obj.get("ContentEncoding", ""))

		response_headers = obj.get("ResponseMetadata", {}).get("HTTPHeaders", {})
		headers = {"cache-control": "private"}

		if collection:
			for header in ("etag", "last-modified"):
				v = response_headers.get(header, "")
				if v:
					headers[header] = v

		return Response(collection, status=status_code, headers=headers)
