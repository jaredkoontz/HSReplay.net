from django.core.management.base import BaseCommand

from hsreplaynet.utils.aws import enable_processing_raw_uploads


class Command(BaseCommand):
	help = "Tell S3 to start triggering Lambda on raw log uploads."

	def handle(self, *args, **options):
		enable_processing_raw_uploads()
