import json
import math
from datetime import date, datetime, timedelta

from django.core.management.base import BaseCommand
from hearthstone.enums import CardClass, FormatType
from hsarchetypes import classify_deck
from sqlalchemy import Date, Integer, String
from sqlalchemy.sql import bindparam, text

from hsreplaynet.decks.models import Archetype, ClusterSnapshot, Deck
from hsreplaynet.utils.aws import redshift


REDSHIFT_QUERY = text("""
	WITH deck_player_class AS (
		SELECT
			t.deck_id, t.player_class
		FROM (
			SELECT
				p.proxy_deck_id AS deck_id,
				p.player_class,
				ROW_NUMBER() OVER (
					PARTITION BY p.proxy_deck_id ORDER BY count(*) DESC
				) AS times_played_rank
			FROM player p
			WHERE p.game_date BETWEEN :start_date AND :end_date
			AND p.game_type = 2
			GROUP BY p.proxy_deck_id, p.player_class
		) t
		WHERE t.times_played_rank = 1
	)
	SELECT
		p.game_type,
		p.proxy_deck_id AS deck_id,
		max(dpc.player_class) AS player_class,
		max(m.archetype_id) AS archetype_id,
		max(p.deck_list) AS deck_list
	FROM player p
	JOIN deck_player_class dpc ON dpc.deck_id = p.proxy_deck_id
	LEFT JOIN deck_archetype_map m ON m.deck_id = p.proxy_deck_id
	WHERE p.game_date BETWEEN :start_date AND :end_date
	AND p.full_deck_known
	AND p.game_type = 2
	GROUP BY p.game_type, p.proxy_deck_id
	ORDER BY p.game_type, p.proxy_deck_id;
""").bindparams(
	bindparam("start_date", type_=Date),
	bindparam("end_date", type_=Date),
).columns(
	game_type=Integer,
	player_class=Integer,
	deck_id=Integer,
	deck_list=String,
	archetype_id=Integer
)


class Command(BaseCommand):
	def __init__(self, *args, **kwargs):
		self.archetype_map = {}
		self.timestamp = datetime.now().isoformat(sep=" ")
		self.signature_weights = {
			FormatType.FT_WILD: {},
			FormatType.FT_STANDARD: {},
		}
		super().__init__(*args, **kwargs)

	def add_arguments(self, parser):
		parser.add_argument("--lookback", nargs="?", type=int, default=7)
		parser.add_argument("--dry-run", action="store_true", default=False)
		parser.add_argument("--force", action="store_true", default=False)

	def get_archetype_name(self, archetype_id):
		if archetype_id in self.archetype_map:
			return self.archetype_map[archetype_id].name
		return "(none)"

	def handle(self, *args, **options):
		conn = redshift.get_new_redshift_connection()
		is_dry_run = options["dry_run"]
		verbosity = options["verbosity"]

		end_ts = date.today()
		start_ts = end_ts - timedelta(days=options["lookback"])

		params = {
			"start_date": start_ts,
			"end_date": end_ts
		}
		compiled_statement = REDSHIFT_QUERY.params(params).compile(bind=conn)

		for card_class in CardClass:
			if 2 <= card_class <= 10:
				for a in Archetype.objects.live().filter(player_class=card_class):
					self.archetype_map[a.id] = a

				# Standard Signature Weights
				standard_weight_values = ClusterSnapshot.objects.get_signature_weights(
					FormatType.FT_STANDARD,
					card_class
				)
				if len(standard_weight_values):
					self.signature_weights[
						FormatType.FT_STANDARD
					][card_class] = standard_weight_values

				# Wild Signature Weights
				wild_weight_values = ClusterSnapshot.objects.get_signature_weights(
					FormatType.FT_WILD,
					card_class
				)
				if len(wild_weight_values):
					self.signature_weights[
						FormatType.FormatType.FT_WILD
					][card_class] = wild_weight_values

		result_set = list(conn.execute(compiled_statement))
		total_rows = len(result_set)
		reclassify_count = 0
		self.stdout.write("Discovered %i decks to reclassify" % (total_rows))
		if is_dry_run:
			self.stdout.write("This is a dry run, will not save results")

		archetypes_to_update = {}
		for counter, row in enumerate(result_set):
			deck_id = row["deck_id"]
			if deck_id is None:
				self.stderr.write("Got deck_id %r ... skipping" % (deck_id))
				continue

			current_archetype_id = row["archetype_id"]
			player_class = CardClass(row["player_class"])
			if player_class == CardClass.NEUTRAL:
				# Most likely noise
				self.stderr.write("Found and skipping NEUTRAL data: %r" % (row))
				continue
			format = FormatType.FT_STANDARD if row["game_type"] == 2 else FormatType.FT_WILD

			dbf_map = {dbf_id: count for dbf_id, count in json.loads(row["deck_list"])}
			if player_class not in self.signature_weights[format]:
				raise RuntimeError(
					"%r not found for %r. Are signatures present?" % (player_class, format)
				)

			if self.signature_weights[format][player_class]:
				new_archetype_id = classify_deck(
					dbf_map, self.signature_weights[format][player_class]
				)

				if new_archetype_id == current_archetype_id and not options["force"]:
					if verbosity > 1:
						self.stdout.write("Deck %r - Nothing to do." % (deck_id))
					continue

				current_name = self.get_archetype_name(current_archetype_id)
				new_name = self.get_archetype_name(new_archetype_id)

				pct_complete = str(math.floor(100.0 * counter / total_rows))

				reclassify_count += 1

				self.stdout.write("\t[%s%%] Reclassifying deck %r: %s => %s\n" % (
					pct_complete, deck_id, current_name, new_name
				))

				if new_archetype_id not in archetypes_to_update:
					archetypes_to_update[new_archetype_id] = []
				archetypes_to_update[new_archetype_id].append(deck_id)

		self.stdout.write("%i decks require an archetype update" % (reclassify_count))

		if not is_dry_run:
			self.stdout.write("Writing results to decks...")
			for archetype_id, decks in archetypes_to_update.items():
				Deck.objects.bulk_update_to_archetype(decks, archetype_id)
			self.stdout.write("Reclassification complete")
		else:
			self.stdout.write("Dry run complete")
