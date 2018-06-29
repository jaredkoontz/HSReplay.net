from oauth2_provider.contrib.rest_framework import OAuth2Authentication, TokenHasScope
from rest_framework import status, views
from rest_framework.generics import ListAPIView
from rest_framework.response import Response

from hsreplaynet.api.partner.serializers import ArchetypesSerializer
from hsreplaynet.api.partner.utils import QueryDataNotAvailableException
from hsreplaynet.decks.api import Archetype
from hsreplaynet.utils.aws.redshift import get_redshift_query

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


class ArchetypesView(ListAPIView):
	authentication_classes = (OAuth2Authentication, )
	permission_classes = (TokenHasScope, PartnerStatsPermission)
	required_scopes = ["stats.partner:read"]
	pagination_class = None
	serializer_class = ArchetypesSerializer

	supported_game_types = ["RANKED_STANDARD"]

	def list(self, request, *args, **kwargs):
		try:
			queryset = self.get_queryset()
		except QueryDataNotAvailableException:
			return Response(status=status.HTTP_202_ACCEPTED)
		serializer = self.get_serializer(queryset, many=True)
		return Response(serializer.data)

	def get_queryset(self):
		queryset = []
		for game_type in self.supported_game_types:
			decks = self._get_decks(game_type)
			popularity = self._get_archetype_popularity(game_type)
			matchups = self._get_archetype_matchups(game_type)
			for archetype in self._get_archetypes(game_type):
				if (
					not self._archetype_has_popularity_data(archetype, popularity) or
					not self._archetype_has_matchup_data(archetype, matchups)
				):
					continue
				queryset.append(dict(
					game_type=game_type,
					archetype=archetype,
					decks=decks,
					popularity=popularity,
					matchups=matchups,
				))
		return queryset

	def _archetype_has_popularity_data(self, archetype, popularity):
		# Temporary workaround to ignore outdated archetypes
		for key in popularity.keys():
			for archetype_popularity in popularity[key]:
				if archetype_popularity["archetype_id"] == archetype.id:
					return True
		return False

	def _archetype_has_matchup_data(self, archetype, matchups):
		# Temporary workaround to ignore outdated archetypes
		return str(archetype.id) in matchups.keys()

	def _get_archetypes(self, game_type):
		if game_type is not "RANKED_STANDARD":
			return []
		return [
			archetype for archetype in Archetype.objects.live().all() if
			archetype.standard_ccp_signature and
			archetype.standard_ccp_signature["components"]
		]

	def _get_decks(self, game_type):
		return self._get_query_data("list_decks_by_win_rate", game_type)

	def _get_archetype_popularity(self, game_type):
		return self._get_query_data("archetype_popularity_distribution_stats", game_type)

	def _get_archetype_matchups(self, game_type):
		return self._get_query_data("head_to_head_archetype_matchups", game_type)

	def _get_query_data(self, query_name, game_type):
		query = get_redshift_query(query_name)
		parameterized_query = query.build_full_params(dict(
			GameType=game_type
		))
		if not parameterized_query.result_available:
			raise QueryDataNotAvailableException()
		response = parameterized_query.response_payload
		return response["series"]["data"]
