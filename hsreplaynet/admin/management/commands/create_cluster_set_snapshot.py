import logging

from django.core.management.base import BaseCommand
from hearthstone.enums import FormatType

from hsreplaynet.decks.models import ClusterSetSnapshot


class Command(BaseCommand):
	def add_arguments(self, parser):
		parser.add_argument("--num-clusters", default=10, type=int)
		parser.add_argument("--merge-threshold", default=0.7, type=float)
		parser.add_argument("--inherit-threshold", default=0.7, type=float)
		parser.add_argument("--lookback", default=1, type=int)
		parser.add_argument("--min-observations", default=10, type=int)
		parser.add_argument("--min-pilots", default=1, type=int)
		parser.add_argument("--experimental-threshold", default=.01, type=float)

	def handle(self, *args, **options):
		logger = logging.getLogger()
		logger.setLevel(logging.DEBUG)
		stream_handler = logging.StreamHandler()
		logger.addHandler(stream_handler)

		for k, v in options.items():
			logger.info("%s:\t%s" % (k, v))

		num_clusters = options["num_clusters"]
		merge_threshold = options["merge_threshold"]
		inherit_threshold = options["inherit_threshold"]
		lookback = options["lookback"]
		min_observations = options["min_observations"]
		min_pilots = options["min_pilots"]
		experimental_threshold = options["experimental_threshold"]

		ClusterSetSnapshot.objects.snapshot(
			FormatType.FT_STANDARD,
			num_clusters=num_clusters,
			merge_threshold=merge_threshold,
			inherit_threshold=inherit_threshold,
			lookback=lookback,
			min_observations=min_observations,
			min_pilots=min_pilots,
			experimental_threshold=experimental_threshold,
		)
