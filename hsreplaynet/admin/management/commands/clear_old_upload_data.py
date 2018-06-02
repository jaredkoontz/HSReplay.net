from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils.timezone import now

from hsreplaynet.uploads.models import Descriptor, UploadEvent


class Command(BaseCommand):
	help = "Clear old upload events and descriptors"

	def add_arguments(self, parser):
		parser.add_argument(
			"--older-than", type=int, default=15,
			help="The maximum number of days to retain"
		)

	def handle(self, *args, **options):
		cutoff = now() - timedelta(days=options.get("older_than"))

		self.stdout.write("Deleting descriptors")
		deleted_descriptors = Descriptor.objects.filter(created__lt=cutoff).delete()
		self.stdout.write("Deleted %i descriptors" % (deleted_descriptors[0]))

		self.stdout.write("Deleting upload events")
		limit = 1000
		while True:
			ids = UploadEvent.objects.filter(created__lt=cutoff).values_list("id", )[:limit]
			qs = UploadEvent.objects.filter(id__in=ids)
			# Using _raw_delete() so that signals and checks aren't performed.
			# The deleted UploadEvent set can be pretty big, using a simple .delete() may OOM.
			deleted = qs._raw_delete(using=qs.db)
			self.stdout.write("Deleted %i successful upload events" % (deleted))
			if deleted < limit:
				self.stdout.write("Stopping")
				break
