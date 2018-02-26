import json
import math
from datetime import date, datetime, timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from hearthstone.enums import CardClass, FormatType
from hsarchetypes import classify_deck
from sqlalchemy import Date, Integer, String
from sqlalchemy.sql import bindparam, text

from hsreplaynet.decks.models import Archetype, ClusterSnapshot, Deck
from hsreplaynet.utils.aws import redshift
from hsreplaynet.utils.aws.clients import FIREHOSE
from hsreplaynet.utils.aws.streams import publish_from_iterable_at_fixed_speed


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
	AND p.game_type = 2
	GROUP BY p.game_type, p.proxy_deck_id
	ORDER BY p.game_type;
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
		self.db_archetypes_to_update = {}
		self.firehose_buffer = []
		self.timestamp = datetime.now().isoformat(sep=" ")
		self.signature_weights = {
			FormatType.FT_WILD: {},
			FormatType.FT_STANDARD: {},
		}
		self.firehose_batch_size = 500
		super().__init__(*args, **kwargs)

	def add_arguments(self, parser):
		parser.add_argument("--lookback", nargs="?", type=int, default=7)
		parser.add_argument("--dry-run", action="store_true", default=False)

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
		self.stdout.write("%i decks to update" % (total_rows))
		if is_dry_run:
			self.stdout.write("Dry run, will not flush to databases")

		for counter, row in enumerate(result_set):
			deck_id = row["deck_id"]
			if not is_dry_run and counter % 100000 == 0:
				self.flush_db_buffer()
				self.flush_firehose_buffer()

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

				if new_archetype_id == current_archetype_id:
					if verbosity > 1:
						self.stdout.write("Deck %r - Nothing to do." % (deck_id))
					continue

				current_name = self.get_archetype_name(current_archetype_id)
				new_name = self.get_archetype_name(new_archetype_id)

				pct_complete = str(math.floor(100.0 * counter / total_rows))

				self.stdout.write("\t[%s%%] Reclassifying deck %r: %s => %s\n" % (
					pct_complete, deck_id, current_name, new_name
				))

				if not is_dry_run:
					self.buffer_archetype_update(deck_id, new_archetype_id)

		if not is_dry_run:
			self.flush_db_buffer()
			self.flush_firehose_buffer()
		else:
			self.stdout.write("Dry run complete")

	def buffer_archetype_update(self, deck_id, new_archetype_id):
		if new_archetype_id not in self.db_archetypes_to_update:
			self.db_archetypes_to_update[new_archetype_id] = []
		self.db_archetypes_to_update[new_archetype_id].append(deck_id)

		firehose_record = "{deck_id}|{archetype_id}|{as_of}\n".format(
			deck_id=str(deck_id),
			archetype_id=str(new_archetype_id or ""),
			as_of=self.timestamp,
		)
		self.firehose_buffer.append(firehose_record)

	def flush_db_buffer(self):
		total_db_updates = sum(len(ids) for ids in self.db_archetypes_to_update.values())
		self.stdout.write("Writing %i updates to the DB" % total_db_updates)
		for archetype_id, ids in self.db_archetypes_to_update.items():
			archetype_name = self.get_archetype_name(archetype_id)
			self.stdout.write("Updating %i decks to archetype %s" % (len(ids), archetype_name))
			Deck.objects.filter(id__in=ids).update(archetype_id=archetype_id)
		self.db_archetypes_to_update = {}

	def flush_firehose_buffer(self):
		self.stdout.write("Writing %i total items to Firehose" % len(self.firehose_buffer))
		bulk_records = self.to_data_blobs(self.firehose_buffer)
		if len(bulk_records):
			publish_from_iterable_at_fixed_speed(
				iter(bulk_records),
				self._publish_function,
				max_records_per_second=5000,
				publish_batch_size=500
			)
		self.firehose_buffer = []

	def to_data_blobs(self, records, max_blob_size=1000):
		result = []
		current_blob_size = 0
		current_blob_components = []

		for rec in records:
			rec_data = rec
			if current_blob_size + len(rec_data) >= max_blob_size:
				result.append({
					"Data": "".join(current_blob_components)
				})
				current_blob_size = 0
				current_blob_components = []

			current_blob_components.append(rec_data)
			current_blob_size += len(rec_data)

		if current_blob_size > 0:
			# At the end flush the remaining blob if its > 0
			result.append({
				"Data": "".join(current_blob_components)
			})

		return result

	def _publish_function(self, batch):
		remainder = batch
		failure_report_records = None
		attempt_count = 0
		while len(remainder) and attempt_count <= 3:
			remainder, failure_report_records = self._attempt_publish_batch(remainder)
			if len(remainder):
				msg = "Firehose attempt %i had %i publish failures"
				self.stdout.write(msg % (attempt_count, len(remainder)))

		if len(failure_report_records):
			msg = "Firehose had %i publish failures remaining after last attempt"
			self.stdout.write(msg % len(failure_report_records))

	def _attempt_publish_batch(self, batch):
		result = FIREHOSE.put_record_batch(
			DeliveryStreamName=settings.ARCHETYPE_FIREHOSE_STREAM_NAME,
			Records=batch
		)

		failed_put_count = result["FailedPutCount"]

		failure_report_records = []
		failed_records = []
		for record, result in zip(batch, result["RequestResponses"]):
			if "ErrorCode" in result:
				failure_report_records.append(dict(
					record=record,
					stream_name=settings.ARCHETYPE_FIREHOSE_STREAM_NAME,
					error_code=result["ErrorCode"],
					error_message=result["ErrorMessage"]
				))
				failed_records.append(record)

		assert failed_put_count == len(failed_records)
		return failed_records, failure_report_records
