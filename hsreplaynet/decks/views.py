import json

from django.http import Http404, JsonResponse
from django.views.generic import View
from django_hearthstone.cards.models import Card
from hearthstone.enums import CardClass, FormatType

from .models import Archetype, ClusterSnapshot


# Return the cluster from the "latest" set with the specified player class, game format, and
# cluster id.

def _get_cluster(player_class, game_format, cluster_id):
	player_class_enum = CardClass[player_class.upper()]
	game_format_enum = FormatType[game_format.upper()]
	cluster = ClusterSnapshot.objects.filter(
		class_cluster__player_class=player_class_enum,
		class_cluster__cluster_set__latest=True,
		class_cluster__cluster_set__game_format=game_format_enum,
		cluster_id=int(cluster_id)
	).first()
	return cluster


class ClusterSnapshotUpdateView(View):

	@staticmethod
	def _get_existing_cluster_for_archetype(
		player_class,
		game_format,
		archetype_id,
		exclude_cluster_id=None
	):
		player_class_enum = CardClass[player_class.upper()]
		game_format_enum = FormatType[game_format.upper()]
		result = ClusterSnapshot.objects.filter(
			class_cluster__player_class=player_class_enum,
			class_cluster__cluster_set__latest=True,
			class_cluster__cluster_set__game_format=game_format_enum,
			external_id=int(archetype_id)
		)
		if exclude_cluster_id is not None:
			result = result.exclude(cluster_id=int(exclude_cluster_id))
		return result.first()

	def get(self, request, game_format, player_class, cluster_id):
		cluster = _get_cluster(player_class, game_format, cluster_id)
		return JsonResponse({"cluster_id": cluster.cluster_id}, status=200)

	def patch(self, request, game_format, player_class, cluster_id):
		cluster = _get_cluster(player_class, game_format, cluster_id)

		if not cluster:
			raise Http404("Cluster not found")

		payload = json.loads(request.body.decode())
		archetype_id = payload.get("archetype_id", None)
		class_cluster = cluster.class_cluster

		if not archetype_id:
			# We are removing an archetype assignment from a cluster
			cluster.external_id = None
			cluster.name = "NEW"
			cluster.required_cards = []

			cluster._augment_data_points()
			cluster.save()

		else:
			# We are adding an archetype assignment
			# First check whether the archetype is already assigned to a cluster
			existing_cluster_for_archetype = self._get_existing_cluster_for_archetype(
				player_class,
				game_format,
				archetype_id,
				exclude_cluster_id=cluster.cluster_id
			)
			if existing_cluster_for_archetype:
				# We are merging this cluster into the one that already exists. Both
				# clusters must satisfy the union of their required cards and false positive
				# rules. The combined sets of required cards and false positive rules will
				# be added to the resulting merged cluster.

				class_cluster.merge_cluster_into_external_cluster(
					existing_cluster_for_archetype,
					cluster
				)

				# Delete both the old clusters, a new one has been created
				cluster.delete()
				existing_cluster_for_archetype.delete()

			else:
				# This is the first cluster getting assigned to the archetype
				archetype = Archetype.objects.get(id=int(archetype_id))
				cluster.external_id = int(archetype_id)
				cluster.name = archetype.name

				# If the archetype has required cards, copy their dbf ids over to the
				# cluster's required_cards JSON array.

				required_card_ids = [c.dbf_id for c in archetype.required_cards.all()]
				if required_card_ids:
					cluster.required_cards = required_card_ids

				cluster._augment_data_points()
				cluster.save()

		# Changing external_id assignments affects CCP_signatures
		# So call update_cluster_signatures() to recalculate
		class_cluster.update_cluster_signatures(
			use_pcp_adjustment=False
		)
		for cluster in class_cluster.clusters:
			cluster.save()

		return JsonResponse({"msg": "OKAY"}, status=200)


class ClusterSnapshotRequiredCardsUpdateView(View):
	"""View handlers for required cards changes for clusters and associated archetypes."""

	def delete(self, request, game_format, player_class, cluster_id, dbf_id_str):
		cluster = _get_cluster(player_class, game_format, cluster_id)

		if not cluster:
			raise Http404("Cluster not found")

		dbf_id = int(dbf_id_str)

		if dbf_id in cluster.required_cards:
			cluster.required_cards.remove(dbf_id)
			cluster.save()

		# Does the cluster have an archetype? If so, remove the card from the archetype as
		# well.

		if cluster.external_id:
			archetype = Archetype.objects.get(pk=cluster.external_id)
			archetype.required_cards.remove(Card.objects.get(dbf_id=dbf_id))

		return JsonResponse({"msg": "OKAY"}, status=200)

	def put(self, request, game_format, player_class, cluster_id, dbf_id_str):
		cluster = _get_cluster(player_class, game_format, cluster_id)

		if not cluster:
			raise Http404("Cluster not found")

		dbf_id = int(dbf_id_str)

		if dbf_id not in cluster.required_cards:
			cluster.required_cards.append(dbf_id)
			cluster.save()

		# Does the cluster have an archetype? If so, add the card to the archetype as well.

		if cluster.external_id:
			archetype = Archetype.objects.get(pk=cluster.external_id)
			archetype.required_cards.add(Card.objects.get(dbf_id=dbf_id))

		return JsonResponse({"msg": "OKAY"}, status=200)
