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
		parser.add_argument("--force", action="store_true")

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

			cluster_set.update_archetype_signatures(force=True)
