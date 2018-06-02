from django.core.management.base import BaseCommand

from hsreplaynet.utils.aws import disable_processing_raw_uploads


class Command(BaseCommand):
	help = "Tell S3 to stop triggering Lambda on raw log uploads."

	def handle(self, *args, **options):
		disable_processing_raw_uploads()
