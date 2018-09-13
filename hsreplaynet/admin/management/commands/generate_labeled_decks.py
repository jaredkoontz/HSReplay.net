import csv
import os.path
from datetime import datetime, timedelta

import pytz
from django.core.management import BaseCommand
from sqlalchemy import Date, Integer, String
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.sql import bindparam, text

from hsreplaynet.decks.models import Archetype, ClusterSetSnapshot
from hsreplaynet.utils.aws.redshift import get_new_redshift_connection


REDSHIFT_QUERY = text("""
	WITH players_playing_deck AS (
		SELECT
			game_id,
			game_date,
			game_type,
			player_id,
			player_class,
			deck_id,
			deck_list
		FROM player
		WHERE
			deck_id = ANY (:deck_ids) AND
			game_type = f_enum_val('BnetGameType.BGT_RANKED_STANDARD') AND
			game_date BETWEEN :min_date AND :max_date AND
			full_deck_known AND
			options_visible
	),
	matching_entities AS (
		SELECT
			e.id AS id,
			e.game_id AS game_id,
			e.initial_dbf_id AS initial_dbf_id,
			p.player_id AS player_id
		FROM entity e
		JOIN players_playing_deck p ON (
			e.game_id = p.game_id AND e.initial_controller = p.player_id
		)
		WHERE e.is_initial_entity
		AND e.initial_dbf_id != 1746
		AND e.game_date BETWEEN :min_date AND :max_date
	),
	revealed_entities AS (
		SELECT
			e.game_id AS game_id,
			e.player_id AS player_id,
			e.initial_dbf_id AS initial_dbf_id,
			COUNT(*) AS "count"
		FROM matching_entities e
		JOIN tag_change tc ON (
			e.game_id = tc.game_id AND e.id = tc.entity_id AND e.player_id = tc.controller
		)
		WHERE tc."tag" = f_enum_val('GameTag.ZONE')
		AND (
			(
				tc.previous_value IN (f_enum_val('Zone.HAND'), f_enum_val('Zone.DECK')) AND
				tc.value = f_enum_val('Zone.PLAY')
			) OR (
				tc.previous_value = f_enum_val('Zone.SECRET') AND
				tc.value = f_enum_val('Zone.GRAVEYARD')
			)
		)
		AND tc.step = f_enum_val('Step.MAIN_ACTION')
		AND tc.game_date BETWEEN :min_date AND :max_date
		GROUP BY e.game_id, e.player_id, e.initial_dbf_id
	),
	observed_decklists AS (
		SELECT
			p.game_id AS game_id,
			p.player_id AS player_id,
			'[' || (
				LISTAGG('[' || e.initial_dbf_id || ',' || e."count" || ']', ',')
					WITHIN GROUP (ORDER BY e.initial_dbf_id)
			) || ']' AS observed_decklist--,
		FROM players_playing_deck p
		JOIN revealed_entities e ON e.game_id = p.game_id AND e.player_id = p.player_id
		GROUP BY p.game_id, p.player_id
	),
	play_sequences AS (
		SELECT
			p.game_id AS game_id,
			p.player_id AS player_id,
			'[' || (
				LISTAGG(b.entity_dbf_id, ',') WITHIN GROUP (ORDER BY b.turn, b.id)
			) || ']' AS play_sequence
		FROM players_playing_deck p
		JOIN block b ON b.game_id = p.game_id AND b.entity_controller = p.player_id
		WHERE b.game_date BETWEEN :min_date AND :max_date
		AND b.block_type = f_enum_val('BlockType.PLAY')
		GROUP BY p.game_id, p.player_id
	)
	SELECT
		p.game_date AS game_date,
		decode(
			p.game_type,
			f_enum_val('BnetGameType.BGT_RANKED_STANDARD'),
			f_enum_val('FormatType.FT_STANDARD'),
			f_enum_val('FormatType.FT_WILD')
		) AS format,
		p.player_class AS player_class,
		p.deck_id AS deck_id,
		p.deck_list AS decklist,
		max(od.observed_decklist) AS observed_decklist,
		max(ps.play_sequence) AS play_sequence
	FROM players_playing_deck p
	JOIN observed_decklists od ON od.game_id = p.game_id AND od.player_id = p.player_id
	JOIN play_sequences ps ON ps.game_id = p.game_id AND ps.player_id = p.player_id
	GROUP BY p.game_id, p.game_date, p.game_type, p.player_class, p.deck_id, p.deck_list
""").bindparams(
	bindparam("min_date", type_=Date),
	bindparam("max_date", type_=Date),
	bindparam("deck_ids", type_=ARRAY(item_type=Integer)),
).columns(
	game_date=Date,
	format=Integer,
	player_class=Integer,
	deck_id=Integer,
	decklist=String,
	observed_decklist=String,
	play_sequence=String,
)


def _get_deck_ids_from_snapshot(snapshot):
	deck_ids = []
	archetype_by_deck_id = {}
	for class_cluster in snapshot.class_clusters:
		for cluster in class_cluster.clusters:
			for data_point in cluster.data_points:
				if "deck_id" not in data_point:
					continue
				deck_id = data_point["deck_id"]
				deck_ids.append(deck_id)
				archetype_by_deck_id[deck_id] = cluster.external_id
	return deck_ids, archetype_by_deck_id


def _get_deck_archetype_id_from_snapshot(deck_id, snapshot):
	for class_cluster in snapshot.class_clusters:
		for cluster in class_cluster.clusters:
			for data_point in cluster.data_points:
				if "deck_id" not in data_point:
					continue
				if data_point["deck_id"] == deck_id:
					return cluster.external_id
	return None


class Command(BaseCommand):
	def add_arguments(self, parser):
		parser.add_argument(
			"out",
			metavar="FILE", help="Where to write the resulting data."
		)
		parser.add_argument(
			"--write-labels", metavar="FILE",
			help="Which file to write the archetype labels to."
		)
		parser.add_argument(
			"--lookback", required=True, type=int,
			metavar="DAYS", help="How many days back we look back from the present."
		)
		parser.add_argument(
			"--resume", action="store_true",
			help="Resume by appending rows instead of overwriting the file."
		)
		parser.add_argument(
			"--noinput", "--no-input", action="store_true",
			help="Skip confirmation step."
		)

	def handle(self, *args, **options):
		if options["resume"]:
			if not os.path.isfile(options["out"]):
				self.stdout.write("File does not exist, unable to resume. Aborting.")
				return
		else:
			if os.path.isfile(options["out"]) and not options["noinput"]:
				msg = "File already exists. Overwrite?"
				if input("%s [y/N] " % msg).lower() != "y":
					self.stdout.write("Aborting.")
					return

		end_date = datetime.now(pytz.utc).replace(hour=0, minute=0, second=0, microsecond=0)
		start_date = end_date - timedelta(days=options["lookback"])
		self.stdout.write(
			"Gathering data from %s to %s..." % (
				start_date.date(),
				end_date.date(),
			)
		)

		conn = get_new_redshift_connection()

		fieldnames = [
			"game_date",
			"format",
			"player_class",
			"decklist",
			"observed_decklist",
			"play_sequence",
			"label",
		]
		rows = 0
		if options["resume"]:
			mode = "w"
		else:
			mode = "wt"
		with open(options["out"], mode, newline="") as csvfile:
			writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
			if not options["resume"]:
				writer.writeheader()

			current_date = start_date
			one_day = timedelta(days=1)
			archetype_ids = set()
			while current_date < end_date:
				self.stdout.write("Gathering decks from %s..." % current_date.date())

				# For each day, let's grab the most recent snapshots for that day
				# While this ignores any previous snapshots on the same day, we don't expect the
				# deck composition to have changed significantly between snapshots
				snapshot = ClusterSetSnapshot.objects.prefetch_related(
					"classclustersnapshot_set"
				).filter(
					promoted_on__lte=current_date
				).order_by("-promoted_on").first()

				if snapshot:
					deck_ids, archetype_by_deck_id = _get_deck_ids_from_snapshot(snapshot)

					# Grab the instance rows from Redshift, based on the cluster deck ids
					self.stdout.write("Gathering games from %s..." % current_date.date())
					params = {
						"min_date": current_date,
						"max_date": current_date,
						"deck_ids": deck_ids,
					}
					compiled_statement = REDSHIFT_QUERY.params(params).compile(bind=conn)
					for row in conn.execute(compiled_statement):
						archetype_id = archetype_by_deck_id[row.deck_id]
						if archetype_id:
							archetype_ids.add(archetype_id)
						vals = {
							"game_date": str(row.game_date),
							"format": row.format,
							"player_class": row.player_class,
							"decklist": row.decklist,
							"observed_decklist": row.observed_decklist,
							"play_sequence": row.play_sequence,
							"label": archetype_id,
						}
						rows += 1
						writer.writerow(vals)
				else:
					self.stdout.write("No snapshot live on %s" % current_date.date())

				current_date += one_day

		if options["write_labels"]:
			with open(options["write_labels"], "wt", newline="") as csvfile:
				writer = csv.DictWriter(csvfile, fieldnames=["label", "name"])
				writer.writeheader()
				archetype_id_list = sorted(archetype_ids)
				for archetype_id in archetype_id_list:
					if archetype_id == -1:
						archetype_name = "Experimental"
					else:
						archetype = Archetype.objects.filter(id=archetype_id).first()
						archetype_name = archetype.name
					writer.writerow({
						"label": archetype_id,
						"name": archetype_name
					})

		self.stdout.write("Done. Wrote %d rows." % rows)
