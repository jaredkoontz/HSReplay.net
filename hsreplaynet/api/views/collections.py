from botocore.exceptions import ClientError
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from oauth2_provider.contrib.rest_framework import OAuth2Authentication
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK
from rest_framework.views import APIView

from hearthsim.identity.accounts.models import BlizzardAccount
from hearthsim.identity.oauth2.permissions import OAuth2HasScopes
from hsreplaynet.settings import S3_COLLECTIONS_BUCKET
from hsreplaynet.utils.aws.clients import S3

from ..serializers.accounts import AccountHiLoRegionSerializer


class BaseCollectionView(APIView):
	authentication_classes = (SessionAuthentication, OAuth2Authentication)
	serializer_class = AccountHiLoRegionSerializer

	s3_key = "collections/{hi}/{lo}/collection.json"

	def perform_authentication(self, request):
		super().perform_authentication(request)
		# All this logic has to be performed *after* authentication, but right
		# before check_permissions(). So we override perform_authentication().

		serializer = self.serializer_class(data=request.GET)
		serializer.is_valid(raise_exception=True)
		accounts = self.get_queryset()
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

	def get_queryset(self):
		if self.request.user.is_staff:
			return BlizzardAccount.objects.all()
		elif self.request.user.is_authenticated:
			return self.request.user.blizzard_accounts.all()
		else:
			return BlizzardAccount.objects.none()


class CollectionURLPresigner(BaseCollectionView):
	permission_classes = (
		OAuth2HasScopes(read_scopes=["collection:write"], write_scopes=[]),
	)

	def get(self, request, **kwargs):
		# Prevent blacklisted clients from uploading an invalid collection
		user_agent = request.META["HTTP_USER_AGENT"] or ""
		is_bad_client = user_agent.startswith(settings.COLLECTION_UPLOAD_USER_AGENT_BLACKLIST)
		if is_bad_client:
			raise PermissionDenied("Your client is outdated. Please update to the latest version.")

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

	def check_permissions(self, request):
		if self.request.method == "GET":
			if not self.can_view_collection(self.request.user, self._account):
				raise PermissionDenied("You are not allowed to view this user's collection.")
		else:
			return super().check_permissions(request)

	def can_view_collection(self, user, blizzard_account):
		if not blizzard_account.user:
			return False
		elif user == blizzard_account.user:
			return True
		else:
			return blizzard_account.user.settings.get("collection-visibility", "") == "public"

	def get_queryset(self):
		if self.request.method == "GET":
			return BlizzardAccount.objects.all()
		return super().get_queryset()

	def get(self, request, **kwargs):
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
		S3.delete_object(**self.s3_params)

		return Response(status=status.HTTP_204_NO_CONTENT)


class CollectionVisibilityView(APIView):
	authentication_classes = (SessionAuthentication, OAuth2Authentication)

	def patch(self, request):
		user = request.user
		visibility = request.data.get("visibility", None)
		key = "collection-visibility"

		if visibility == "public":
			user.settings[key] = "public"
		elif key in user.settings:
			del user.settings[key]
		user.save()

		return Response(status=HTTP_200_OK)
