import csv

from django.core.management.base import BaseCommand

from hsreplaynet.utils.influx import influx


INFLUX_QUERY = """
SELECT
	actual_deck,
	predicted_deck
FROM deck_prediction
WHERE time > now() - {hours}h AND made_prediction = 'True';
"""


class Command(BaseCommand):
	def add_arguments(self, parser):
		parser.add_argument("--hours", default=1)
		parser.add_argument("--output", default="deck_prediction_report.csv")

	def handle(self, *args, **options):
		result = influx.query(INFLUX_QUERY.format(hours=options["hours"])).raw
		series = result["series"][0]
		columns = series["columns"][1:]
		values = series["values"]
		with open(options["output"], "w") as out:
			writer = csv.DictWriter(out, fieldnames=columns, quoting=csv.QUOTE_ALL)
			writer.writeheader()
			for vals in values:
				row = dict(zip(columns, vals[1:]))
				writer.writerow(row)
