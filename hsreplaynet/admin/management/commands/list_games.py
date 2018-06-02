import os.path
import zipfile

from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand

from hsreplaynet.games.models import GameReplay


class Command(BaseCommand):
	def add_arguments(self, parser):
		parser.add_argument(
			"--limit", nargs="?", type=int,
			help="Limit total results"
		)
		parser.add_argument(
			"--username", nargs="?", type=str,
			help="Filter by username"
		)
		parser.add_argument(
			"--scenario", nargs="?", type=int,
			help="Filter by scenario ID"
		)
		parser.add_argument(
			"--uploads", action="store_true",
			help="List upload Power.log instead of hsreplay.xml file"
		)
		parser.add_argument(
			"--zipfile", nargs="?", type=str,
			help="Write all filtered games to this zip"
		)

	def handle(self, *args, **options):
		games = GameReplay.objects.all()
		scenario = options["scenario"]
		if scenario:
			games = games.filter(global_game__scenario_id=scenario)

		username = options["username"]
		if username:
			games = games.filter(user__username=username)

		limit = options["limit"]
		if limit:
			games = games[:limit]

		if options["uploads"]:
			results = games.values_list("uploads__file")
		else:
			results = games.values_list("replay_xml")
		results = [path for (path, ) in results]

		zip_name = options["zipfile"]
		if zip_name:
			self.make_zip(zip_name, results)
		else:
			for path in results:
				self.stdout.write(path)

	def make_zip(self, zipname, results):
		written = 0
		failed = []

		with open(zipname, "wb") as final_zip:
			with zipfile.PyZipFile(final_zip, "w", zipfile.ZIP_DEFLATED) as zf:
				for path in results:
					basename = os.path.basename(path)

					try:
						f = default_storage.open(path)
					except Exception as e:
						self.stderr.write("Cannot open %r: %s" % (path, e))
						failed.append(path)
						continue

					zf.writestr(basename, f.read())
					self.stdout.write(path)
					written += 1

		self.stdout.write("Written %i objects to %r" % (written, final_zip.name))
		if failed:
			self.stderr.write("The following files failed to open:")
			for path in failed:
				self.stderr.write("  %s" % (path))
			exit(8)
