import importlib

from django.conf import settings
from django.core.management import BaseCommand


class Command(BaseCommand):
	def add_arguments(self, parser):
		parser.add_argument(
			"--table",
			choices=settings.DYNAMODB_TABLES.keys(),
			help="Logical DynamoDB table name (see settings)"
		)

		parser.add_argument("--wait", help="Wait until table is ready before returning")

	def _create_table(self, table_name, wait=True):
		table_metadata = settings.DYNAMODB_TABLES[table_name]

		module_name, class_name = table_metadata["MODEL"].rsplit(".", maxsplit=1)
		model_class = getattr(importlib.import_module(module_name), class_name)

		model_class.create_table(wait=wait)

	def handle(self, *args, **kwargs):
		table_name = kwargs.get("table")
		wait = kwargs.get("wait", True)

		if table_name:
			self._create_table(table_name, wait=wait)
		else:
			for table_name in settings.DYNAMODB_TABLES:
				self._create_table(table_name, wait=wait)
