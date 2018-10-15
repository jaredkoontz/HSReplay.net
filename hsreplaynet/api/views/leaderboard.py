import json

from allauth.socialaccount.models import SocialAccount
from django.db.models import F, Func, Value
from django.views import View
from hearthstone.enums import BnetRegion
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.generics import ListAPIView
from rest_framework.response import Response

from hsredshift.analytics import filters
from hsreplaynet.analytics.utils import trigger_if_stale
from hsreplaynet.api.partner.utils import QueryDataNotAvailableException
from hsreplaynet.api.permissions import UserHasFeature
from hsreplaynet.api.serializers.leaderboard import LeaderboardSerializer
from hsreplaynet.utils import get_logger, influx
from hsreplaynet.utils.aws.redshift import get_redshift_query


class BaseLeaderboardView(ListAPIView):
	permission_classes = [UserHasFeature("leaderboards")]
	queryset = SocialAccount.objects.filter(provider="battlenet")
	serializer_class = LeaderboardSerializer

	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)

		self.redshift_query_data = None

	def list(self, request, *args, **kwargs):
		error = None
		try:
			queryset = self.filter_queryset(self.get_queryset())

			# We pull back all users with matching account los, which may result in
			# duplicates across region, so we need to do region filtering on the result set
			# at the application level. It can't be pushed down to the database, since,
			# despite modeling extra_data as a JSONField in Django, it's a text field in
			# Postgres, and the type coercion necessary to do the filtering in Postgres is
			# quite difficult to capture in Django ORM semantics.

			serializer_context = self.get_serializer_context()

			def match_region(r):
				region_str = "REGION_%s" % json.loads(r.extra_data).get("region").upper()
				region_account_lo = "%s_%s" % (BnetRegion[region_str].value, r.uid)
				return region_account_lo in serializer_context["redshift_query_data"]

			region_filtered_queryset = filter(match_region, queryset)
			serializer = self.get_serializer(region_filtered_queryset, many=True)

			return Response(serializer.data)
		except QueryDataNotAvailableException as e:
			error = type(e).__name__
			return Response(status=status.HTTP_202_ACCEPTED)
		except Exception as e:
			error = type(e).__name__
			raise e
		finally:
			influx.influx_metric("hsreplaynet_leaderboard_api", {"count": 1}, error=error)

	def get_parameterized_query_filter(self, filter_name, filter_cls, allowed_values):
		"""Validate and return a specific filter for the target query from the request.

		:param filter_name: the name of the filter as passed in the request
		:param filter_cls: the filter enum class
		:param allowed_values: the subset of allowed enum members
		:return: the validate filter value
		"""

		filter_value = self.request.GET.get(filter_name, "")
		if filter_value not in allowed_values:
			raise ValidationError({filter_name: "Invalid value: %r" % filter_value})

		return filter_cls[filter_value]

	def get_parameterized_query_filters(self):
		"""Validate and return the filters for the target query from the request.

		:return: the validated filters as a dict to pass to build_full_params
		"""

		param_dict = dict(
			Region=self.get_parameterized_query_filter(
				"Region",
				filters.Region,
				filters.Region.__members__
			),
			TimeRange=self.get_parameterized_query_filter(
				"TimeRange",
				filters.TimeRange, [
					"CURRENT_SEASON",
					"PREVIOUS_SEASON",
					"CURRENT_EXPANSION"
				])
		)

		if "RankRange" in self.request.GET:
			param_dict["RankRange"] = self.get_parameterized_query_filter(
				"RankRange",
				filters.RankRange, [
					"ALL",
					"TOP_1000_LEGEND"
				])

		return param_dict

	def filter_parameterized_query_response(self, payload):
		"""Apply a post-filter to the response payload from Redshift.

		The default implementation returns the payload unmodified.

		:param payload: the response payload
		:return: the filtered response payload
		"""

		return payload

	def get_parameterized_query(self):
		"""Return the hsredshift parameterized query object to lookup / execute."""

		raise NotImplemented()

	def _get_redshift_query_data(self):

		# Fetch the results for the target Redshift query, trigger a refresh as necessary,
		# and cache the response for subsequent calls.

		if not self.redshift_query_data:
			parameterized_query = self.get_parameterized_query()
			try:
				trigger_if_stale(parameterized_query)
			except OSError as err:
				get_logger().warning(
					"Failed to trigger stale query refresh: " + str(err)
				)

			if not parameterized_query.result_available:
				raise QueryDataNotAvailableException()

			response = parameterized_query.response_payload

			self.redshift_query_data = self.filter_parameterized_query_response(
				response["series"]["data"]
			)

		return self.redshift_query_data

	def filter_queryset(self, queryset):

		# Apply an additional ordering clause to the query to order the results by account
		# lo in the same order they appear in the Redshift query results.

		redshift_query_data = self._get_redshift_query_data()
		account_los = list(map(lambda r: r["account_lo"], redshift_query_data))

		# ...need to "manually" assemble this clause of the query, 'cuz Django doesn't know
		# about explicit orderings.

		return queryset.order_by(
			Func(Value("{%s}" % ",".join(account_los)), F("uid"), function="array_position")
		)

	def get_serializer_context(self):
		context = super().get_serializer_context()
		redshift_query_data = self._get_redshift_query_data()

		context["redshift_query_data"] = {
			"%s_%s" % (x["region"], x["account_lo"]): x for x in redshift_query_data
		}

		return context


class LeaderboardView(BaseLeaderboardView):
	"""BaseLeaderboardView subclass for serving global and class-level leaderboards."""

	def filter_parameterized_query_response(self, payload):

		# If filtering by PlayerClass, pull out the class-specific part of the
		# account_lo_leaderboard_by_winrate payload for the target class.

		if "PlayerClass" in self.request.GET:
			filter_value = self.request.GET["PlayerClass"]
			if filter_value in payload:
				return payload[filter_value]
			else:
				raise ValidationError({f"PlayerClass": "Invalid value: {filter_value}"})
		else:
			return payload["ALL"]

	def get_parameterized_query(self):
		query = get_redshift_query("account_lo_leaderboard_by_winrate")

		# Support RANKED_STANDARD and RANKED_WILD leaderboards in addition to the base
		# leaderboard filters.

		param_dict = self.get_parameterized_query_filters()
		param_dict["GameType"] = self.get_parameterized_query_filter(
			"GameType",
			filters.GameType, [
				"RANKED_STANDARD",
				"RANKED_WILD"
			]
		)

		return query.build_full_params(param_dict)


class ArchetypeLeaderboardView(BaseLeaderboardView):
	"""BaseLeaderboardView subclass for serving archetype-specific leaderboards."""

	def filter_parameterized_query_response(self, payload):
		return payload["ALL"]  # This is the only key in the archetype leaderboard payload

	def get_parameterized_query(self):
		query = get_redshift_query("account_lo_archetype_leaderboard_by_winrate")

		if "archetype_id" not in self.request.GET:
			raise ValidationError({f"archetype_id": "Invalid value: {filter_value}"})

		# This query is implicitly filtered by GameType=RANKED_STANDARD at the moment.

		param_dict = self.get_parameterized_query_filters()
		param_dict["archetype_id"] = int(self.request.GET["archetype_id"])

		return query.build_full_params(param_dict)


class DelegatingLeaderboardView(View):
	"""View handler to delegate to the appropriate leaderboard handler based on request.

	Dispatches requests to the ArchetypeLeaderboardView if the "archetype_id" request
	parameter is present, otherwise dispatches to the LeaderboardView.
	"""

	def dispatch(self, request, *args, **kwargs):
		view = ArchetypeLeaderboardView.as_view() if "archetype_id" in request.GET \
			else LeaderboardView.as_view()

		return view(request, *args, **kwargs)
