from django.core.management.base import BaseCommand, CommandError

from hsreplaynet.decks.models import ClusterSetSnapshot


def get_archetype_ids(cluster_set):
	for class_cluster in cluster_set.class_clusters:
		for cluster in class_cluster.clusters:
			if cluster.external_id == -1 or not cluster.external_id:
				continue
			yield cluster.external_id


class Command(BaseCommand):
	def add_arguments(self, parser):
		parser.add_argument(
			"--force", action="store_true",
			help="Promote cluster snapshot even if archetypes are not inherited."
		)
		parser.add_argument(
			"--overwrite-archetypes", action="store_true",
			help="""
			DEPRECATED: When this flag is set, the following behaviour is enabled: For each
			cluster with an archetype, we overwrite the archetype for all decks in that cluster
			with the clusters archetype. This is generally not problematic, but can lead to cases
			where we force an archetype onto a deck that does not fulfill the required_cards
			criteria but got merged into the same cluster because it is similar enough, leading to
			decks on the site that don't contain the required card(s). See HSR-407 for more context.
			"""
		)

	def handle(self, *args, **options):
		current_set = ClusterSetSnapshot.objects.filter(live_in_production=True).first()
		cluster_set = ClusterSetSnapshot.objects.filter(latest=True).first()
		if cluster_set:
			if current_set:
				archetypes_in_production = get_archetype_ids(current_set)
				archetypes_to_go = get_archetype_ids(cluster_set)
				remainder = set(archetypes_in_production) - set(archetypes_to_go)
				if remainder and not options["force"]:
					raise CommandError("Archetypes missing: %r. Will not promote." % (remainder))

			cluster_set.update_archetype_signatures(
				force=True, overwrite_archetypes=options["overwrite_archetypes"]
			)
