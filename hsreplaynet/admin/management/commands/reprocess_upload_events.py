from dateutil.parser import parse as parse_timestamp
from django.core.management.base import BaseCommand

from hsreplaynet.uploads.models import UploadEvent
from hsreplaynet.uploads.processing import queue_upload_events_for_reprocessing


class Command(BaseCommand):
	def add_arguments(self, parser):
		parser.add_argument(
			"--from", required=True,
			help="Initial date (YYYY-MM-DD HH:MM:SSZ)",
		)
		parser.add_argument(
			"--to", required=True,
			help="End date (YYYY-MM-DD HH:MM:SSZ)",
		)

	def handle(self, *args, **options):
		from_date = parse_timestamp(options["from"])
		to_date = parse_timestamp(options["to"])
		uploads = UploadEvent.objects.filter(
			created__gte=from_date,
			created__lte=to_date
		)

		queue_upload_events_for_reprocessing(uploads, use_kinesis=True)
