from django.core.management.base import BaseCommand

from hsreplaynet.uploads.processing import queue_raw_uploads_for_processing


class Command(BaseCommand):
	help = "Requeue all raw logs in S3 to be processed."

	def add_arguments(self, parser):
		parser.add_argument("--attempt_reprocessing", action="store_true", default=False)
		parser.add_argument(
			"--limit",
			default=None,
			help="The maximum number of records to requeue"
		)

	def handle(self, *args, **options):
		if options["limit"]:
			limit = int(options["limit"])
		else:
			limit = None

		queue_raw_uploads_for_processing(
			options["attempt_reprocessing"],
			limit
		)
