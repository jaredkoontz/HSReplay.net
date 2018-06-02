from django.conf import settings
from django.core.management.base import BaseCommand

from hsreplaynet.utils.aws.redshift import get_redshift_catalogue


class Command(BaseCommand):
	def handle(self, *args, **options):
		catalogue = get_redshift_catalogue()
		for name, query in catalogue.registry.items():
			if query.uses_archetypes:
				query.mark_all_stale()
				if name in settings.ARCHETYPE_QUERIES_FOR_IMMEDIATE_REFRESH:
					for permutation in query.generate_cachable_parameter_permutations():
						parameterized_query = query.build_full_params(permutation)
						parameterized_query.schedule_refresh()
