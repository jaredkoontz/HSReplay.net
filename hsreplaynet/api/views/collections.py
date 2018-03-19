from botocore.exceptions import ClientError
from django.core.exceptions import ObjectDoesNotExist
from oauth2_provider.contrib.rest_framework import OAuth2Authentication
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from hearthsim.identity.accounts.models import BlizzardAccount
from hearthsim.identity.oauth2.permissions import OAuth2HasScopes
from hsreplaynet.settings import S3_COLLECTIONS_BUCKET
from hsreplaynet.utils.aws.clients import S3

from ..serializers.collections import CollectionRequestSerializer


class BaseCollectionView(APIView):
	authentication_classes = (SessionAuthentication, OAuth2Authentication)
	serializer_class = CollectionRequestSerializer

	s3_key = "collections/{hi}/{lo}/collection.json"

	def _serialize_request(self, request):
		serializer = self.serializer_class(data=request.GET)
		serializer.is_valid(raise_exception=True)

		if request.user.is_staff:
			accounts = BlizzardAccount.objects
		else:
			accounts = request.user.blizzard_accounts

		params = {"account_lo": serializer.validated_data["account_lo"]}
		# We allow specifying either `account_hi` or `region`.
		# So we have to pass the appropriate pair of parameters to find the account.
		# The existence of the parameters is checked in the serializer itself.
		for key in ("account_hi", "region"):
			if key in serializer.validated_data:
				params[key] = serializer.validated_data[key]

		try:
			self._account = accounts.get(**params)
		except ObjectDoesNotExist:
			raise ValidationError({"detail": f"Could not find a matching Blizzard account."})

		key = self.s3_key
		if request.auth and not request.auth.application.livemode:
			# For non-livemode oauth apps, return a testmode url
			key = "sandbox/" + key

		self.s3_params = {
			"Bucket": S3_COLLECTIONS_BUCKET,
			"Key": key.format(hi=self._account.account_hi, lo=self._account.account_lo),
		}


class CollectionURLPresigner(BaseCollectionView):
	permission_classes = (
		OAuth2HasScopes(read_scopes=["collection:write"], write_scopes=[]),
	)

	def get(self, request, **kwargs):
		self._serialize_request(request)
		expires_in = 180  # Seconds
		self.s3_params["ContentType"] = "application/json"

		presigned_url = S3.generate_presigned_url(
			"put_object", Params=self.s3_params, HttpMethod="PUT", ExpiresIn=expires_in
		)

		return Response({
			"method": "PUT",
			"url": presigned_url,
			"content_type": self.s3_params["ContentType"],
			"expires_in": expires_in,
			"account_hi": self._account.account_hi,
			"account_lo": self._account.account_lo,
			"region": self._account.region,
		})


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

	def get(self, request, **kwargs):
		self._serialize_request(request)

		# Add cache headers to the s3 request
		self.s3_params.update(self._translate_s3_cache_headers(self.request.META))

		try:
			obj = S3.get_object(**self.s3_params)
		except S3.exceptions.NoSuchKey:
			raise NotFound()
		except ClientError as e:
			status_code = e.response.get("ResponseMetadata", {}).get("HTTPStatusCode", 0)
			if status_code in (status.HTTP_304_NOT_MODIFIED, status.HTTP_412_PRECONDITION_FAILED):
				return Response(status=status_code)
			else:
				raise

		collection = self._parse_collection_json(obj.get("Body"), obj.get("ContentEncoding", ""))

		response_headers = obj.get("ResponseMetadata", {}).get("HTTPHeaders", {})
		headers = {"cache-control": "private, no-cache"}

		if collection:
			for header in ("etag", "last-modified"):
				v = response_headers.get(header, "")
				if v:
					headers[header] = v

		return Response(collection, headers=headers)

	def delete(self, request, **kwargs):
		self._serialize_request(request)

		S3.delete_object(**self.s3_params)

		return Response(status=status.HTTP_204_NO_CONTENT)
