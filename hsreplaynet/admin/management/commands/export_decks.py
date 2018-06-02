import json
from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.db import connection

from hsreplaynet.decks.models import Deck
from hsreplaynet.utils.db import execute_query


QUERY_DECK_FEATURE_VEC = """
SELECT array_agg(t.id) AS "vector" FROM (
SELECT c.id::text AS "id"
FROM card c
WHERE c.collectible = TRUE AND c.type != 3
ORDER BY c.id
) t;
"""


DECKS_QUERY = """
SELECT dss.deck_id, sum(dss.matches) AS "observations"
FROM deck_summary_stats dss
WHERE dss.epoch_seconds BETWEEN date_part('epoch', DATE '%s') AND date_part(
'epoch', DATE '%s')
AND dss.game_type = 2
GROUP BY dss.deck_id
HAVING sum(dss.matches) >= 50;
"""


class Command(BaseCommand):
	def add_arguments(self, parser):
		parser.add_argument(
			"--lookback", default="1",
			help="How many days back we look from the present"
		)
		parser.add_argument(
			"--offset", default="0",
			help="How many days back we shift the time window"
		)
		parser.add_argument(
			"--out", default="decks.json",
			help="The file where we will write the output too"
		)

	def generate_card_id_maps(self):
		cursor = connection.cursor()
		cursor.execute(QUERY_DECK_FEATURE_VEC)
		results = list(cursor.fetchall())
		map = {}
		reverse_map = {}
		for idx, card_id in enumerate(results[0][0]):
			map[idx] = card_id
			reverse_map[card_id] = idx
		return map, reverse_map

	def generate_deck_feature_vector(self, reverse_map, includes):
		try:
			return {reverse_map[id]: count for id, count in includes}
		except Exception:
			return None

	def handle(self, *args, **options):
		result = {
			"map": {},
			"decks": {}
		}

		card_id_map, reverse_map = self.generate_card_id_maps()
		result["map"] = card_id_map

		offset = int(options["offset"])
		lookback = int(options["lookback"])
		today = date.today()
		date_from = (today - timedelta(days=(offset + lookback))).isoformat()
		date_to = (today - timedelta(days=offset)).isoformat()

		for row in execute_query(DECKS_QUERY % (date_from, date_to)):
			d = Deck.objects.get(id=row["deck_id"])

			if len(d.card_id_list()) == 30:
				player_class = d.deck_class

				if player_class and (player_class.value not in result["decks"]):
					result["decks"][player_class.value] = []

				includes = d.includes.values_list("card__id", "count")
				deck_vector = self.generate_deck_feature_vector(reverse_map, includes)
				if deck_vector and player_class:
					deck_payload = {
						"observations": row["observations"],
						"cards": deck_vector
					}
					result["decks"][player_class.value].append(deck_payload)

		with open(options["out"], "wt") as out:
			out.write(json.dumps(result, indent=4))
