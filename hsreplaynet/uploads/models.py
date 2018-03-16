import json
import os
import re
import time
from base64 import b64decode
from datetime import datetime, timedelta
from enum import IntEnum
from uuid import uuid4

from django.conf import settings
from django.contrib.postgres.fields import JSONField
from django.db import models, transaction
from django.urls import reverse
from django.utils import timezone
from django_intenum import IntEnumField
from sqlalchemy.sql import func, select

from hsredshift.etl.materialized_views import (
	get_materialized_view_list, get_materialized_view_update_statement, get_view_dependencies
)
from hsredshift.etl.models import create_staging_table, list_staging_eligible_tables
from hsredshift.utils.sql import is_in_flight, run_redshift_background_statement
from hsreplaynet.utils import aws, log
from hsreplaynet.utils.aws import redshift, streams
from hsreplaynet.utils.fields import ShortUUIDField
from hsreplaynet.utils.influx import influx_metric, influx_timer
from hsreplaynet.utils.instrumentation import error_handler
from hsreplaynet.utils.synchronization import advisory_lock


def get_handle_status(handle, min_statements=1):
	"""
	The handle can have:
		- No records
		- Below the min records with errors
		- Below the min records without errors
		- Above the min records with errors
		- Above the min records without errors
	"""
	query = """
	SELECT
		sum(aborted) > 0 AS had_errors,
		count(*) AS num_statements,
		max(endtime) AS finished_at
	FROM SVL_QLOG WHERE label = '%s'
	GROUP BY label;
	""" % handle
	log.info("Fetching handle status for: %s" % handle)

	conn = redshift.get_new_redshift_connection(etl_user=True)
	rp = conn.execute(query)
	first_row = rp.first()
	if first_row:
		had_errors = first_row[0]
		num_statements = first_row[1]
		finished_at = first_row[2]

		# Even if we have fewer than the min_statements
		# We assume that no further statements will execute
		# Due to the earlier aborted query
		is_complete = had_errors or (num_statements >= min_statements)
		msg = "is_complete = %s, had_errors = %s, num_statements = %s, finished_at = %s"
		log.info(msg % (is_complete, had_errors, num_statements, finished_at))
		return is_complete, had_errors, num_statements, finished_at

	else:
		log.info("No records in SVL_QLOG for handle yet")
		if not is_in_flight(conn, handle):
			log.warn("%s does not seem to be in_flight" % (handle))
			# TODO: Return an error state so we can fail or restart
		return False, None, None, None


_md_cache = {}


def get_redshift_metadata(refresh=False):
	from sqlalchemy import MetaData
	from sqlalchemy.exc import InternalError

	if "md" not in _md_cache or refresh:
		md = MetaData()

		try:
			md.reflect(redshift.get_redshift_engine(etl_user=True))
		except InternalError:
			# We get intermittent cache lookup failures
			# Due to concurrent modifications of an internal postgres engine cache
			# AWS suggests waiting and then re-attempting.
			# https://dba.stackexchange.com/questions/173815/redshift-internalerror-cache-lookup-failed-for-relation
			time.sleep(5)
			# We try one more time before raising the exception
			md.reflect(redshift.get_redshift_engine(etl_user=True))

		_md_cache["md"] = md
	return _md_cache["md"]


class UploadEventStatus(IntEnum):
	UNKNOWN = 0
	PROCESSING = 1
	SERVER_ERROR = 2
	PARSING_ERROR = 3
	SUCCESS = 4
	UNSUPPORTED = 5
	VALIDATION_ERROR = 6
	VALIDATING = 7
	UNSUPPORTED_CLIENT = 8
	PENDING = 9
	UNSUPPORTED_BUILD = 10

	@classmethod
	def processing_statuses(cls):
		return [
			cls.PENDING,
			cls.PROCESSING,
			cls.VALIDATING,
		]


class RawUploadState(IntEnum):
	NEW = 0
	HAS_UPLOAD_EVENT = 1


class RawUpload(object):
	"""
	Represents a raw upload in S3.
	"""

	LOG_KEY_PATTERN = r"(?P<prefix>raw|uploads)/(?P<ts>[\d/]{16})/(?P<shortid>\w{22})\.(?:power|canary)\.log"  # noqa
	TIMESTAMP_FORMAT = "%Y/%m/%d/%H/%M"

	def __init__(self, bucket, key):
		self.bucket = bucket
		self.log_key = key
		self.upload_event = None
		self._descriptor_on_postgres = False
		self._descriptor_on_s3 = False

		match = re.match(self.LOG_KEY_PATTERN, key)
		if not match:
			raise ValueError("Failed to match key %r to an upload pattern" % (key))

		groups = match.groupdict()
		self.shortid = groups["shortid"]
		self.timestamp = datetime.strptime(groups["ts"], self.TIMESTAMP_FORMAT)

		if groups["prefix"] == "raw":
			self.state = RawUploadState.NEW
			# Lazy-loaded from S3
			self._descriptor = None
		elif groups["prefix"] == "uploads":
			self.state = RawUploadState.HAS_UPLOAD_EVENT
			self.upload_event = UploadEvent.objects.get(shortid=self.shortid)
			self.descriptor_json = self.upload_event.descriptor_data
			self._descriptor = json.loads(self.descriptor_json)
		else:
			assert False

		# If this is changed to True before this RawUpload is sent to a kinesis stream
		# Then the kinesis lambda will attempt to reprocess instead of exiting early
		self.attempt_reprocessing = False

	def __repr__(self):
		return "<RawUpload %s:%s:%s>" % (self.shortid, self.bucket, self.log_key)

	def prepare_upload_event_log_location(self, bucket, key):
		if key != self.log_key:
			copy_source = "%s/%s" % (self.bucket, self.log_key)
			log.debug("Copying power.log %r to %r:%r" % (copy_source, bucket, key))
			aws.S3.copy_object(Bucket=bucket, Key=key, CopySource=copy_source)

	def delete(self):
		# We only perform delete on NEW raw uploads because when we get to this point we have
		# a copy of the log and descriptor attached to the UploadEvent
		if self.state == RawUploadState.NEW:
			log.debug("Deleting files from S3")
			aws.S3.delete_object(Bucket=self.bucket, Key=self.log_key)

			if self._descriptor_on_s3:
				aws.S3.delete_object(
					Bucket=settings.S3_DESCRIPTORS_BUCKET, Key=self.descriptor_s3_key
				)

			if self._descriptor_on_postgres:
				Descriptor.objects.filter(shortid=self.shortid).delete()

	@staticmethod
	def from_s3_event(event):
		bucket = event["bucket"]["name"]
		key = event["object"]["key"]

		return RawUpload(bucket, key)

	@staticmethod
	def from_upload_event(event):
		bucket = settings.AWS_STORAGE_BUCKET_NAME
		log_key = str(event.file)

		return RawUpload(bucket, log_key)

	@staticmethod
	def from_kinesis_event(kinesis_event):
		# Kinesis returns the record bytes data base64 encoded
		payload = b64decode(kinesis_event["data"])
		json_str = payload.decode("utf8")
		data = json.loads(json_str)

		result = RawUpload(data["bucket"], data["log_key"])

		if "attempt_reprocessing" in data:
			result.attempt_reprocessing = data["attempt_reprocessing"]

		return result

	@property
	def descriptor_s3_key(self):
		return "descriptors/%s.json" % (self.shortid)

	@property
	def kinesis_data(self):
		data = {
			"bucket": self.bucket,
			"log_key": self.log_key,
			"attempt_reprocessing": self.attempt_reprocessing
		}
		json_str = json.dumps(data)
		payload = json_str.encode("utf8")
		# Kinesis will base64 encode the payload bytes for us.
		# However, when we read the record back we will have to decode from base64 ourselves
		return payload

	@property
	def kinesis_partition_key(self):
		# The partition key is also used as the tracing ID
		return self.shortid

	@property
	def log_url(self):
		return aws.S3.generate_presigned_url(
			"get_object",
			Params={
				"Bucket": self.bucket,
				"Key": self.log_key,
			},
			ExpiresIn=60 * 60 * 24,
			HttpMethod="GET"
		)

	@property
	def descriptor(self):
		if self._descriptor is None:
			self._load_descriptor()
		return self._descriptor

	def _load_descriptor(self):
		try:
			self._load_descriptor_from_postgres()
		except Descriptor.DoesNotExist:
			self._load_descriptor_from_s3()
		except Exception as e:
			error_handler(e)
			self._load_descriptor_from_s3()

	def _load_descriptor_from_postgres(self):
		obj = Descriptor.objects.get(shortid=self.shortid)
		self._descriptor = obj.descriptor
		self.descriptor_json = json.dumps(self._descriptor)
		self._descriptor_on_postgres = True

	def _load_descriptor_from_s3(self):
		obj = aws.S3.get_object(
			Bucket=settings.S3_DESCRIPTORS_BUCKET, Key=self.descriptor_s3_key
		)
		self.descriptor_json = obj["Body"].read().decode("utf-8")
		self._descriptor = json.loads(self.descriptor_json)
		self._descriptor_on_s3 = True


def _generate_upload_path(instance, filename):
	return _generate_upload_key(instance.created, instance.shortid, "power.log")


def _generate_upload_key(ts, shortid, suffix="power.log"):
	# This timestamp in the key path is where we are capturing when
	# the log was uploaded to S3
	timestamp = ts.strftime("%Y/%m/%d/%H/%M")
	return "uploads/%s/%s.%s" % (timestamp, shortid, suffix)


class Descriptor(models.Model):
	shortid = ShortUUIDField("Short ID", primary_key=True)
	descriptor = JSONField()
	created = models.DateTimeField(auto_now=True)

	def __str__(self):
		return self.shortid

	@property
	def upload_event(self):
		try:
			return UploadEvent.objects.get(shortid=self.shortid)
		except UploadEvent.DoesNotExist:
			return None


class UploadEvent(models.Model):
	"""
	Represents a game upload, before the creation of the game itself.

	The metadata captured is what was provided by the uploader.
	The raw logs have not yet been parsed for validity.
	"""

	id = models.BigAutoField(primary_key=True)
	shortid = ShortUUIDField("Short ID")
	token_uuid = models.UUIDField(null=True, blank=True, db_column="token_id")
	api_key_id = models.IntegerField(null=True, blank=True, db_column="api_key_id")
	game_id = models.BigIntegerField(null=True, blank=True, db_column="game_id")
	created = models.DateTimeField(auto_now_add=True, db_index=True)
	upload_ip = models.GenericIPAddressField(null=True)
	status = IntEnumField(
		enum=UploadEventStatus, default=UploadEventStatus.UNKNOWN, db_index=True
	)
	tainted = models.BooleanField(default=False)
	error = models.TextField(blank=True)
	traceback = models.TextField(blank=True)
	test_data = models.BooleanField(default=False)
	canary = models.BooleanField(default=False)

	metadata = models.TextField(blank=True)
	file = models.FileField(upload_to=_generate_upload_path, null=True)
	descriptor_data = models.TextField(blank=True)
	user_agent = models.CharField(max_length=100, blank=True)
	log_stream_name = models.CharField(max_length=64, blank=True)
	log_group_name = models.CharField(max_length=64, blank=True)
	updated = models.DateTimeField(auto_now=True)

	def __str__(self):
		return self.shortid

	@property
	def log_upload_date(self):
		raw_upload = RawUpload.from_upload_event(self)
		return timezone.make_aware(raw_upload.timestamp)

	@property
	def token(self):
		if not hasattr(self, "_token"):
			from hearthsim.identity.accounts.models import AuthToken
			if self.token_uuid:
				self._token = AuthToken.objects.get(key=self.token_uuid)
			else:
				self._token = None

		return self._token

	@token.setter
	def token(self, auth_token):
		if auth_token:
			self._token = auth_token
			self.token_uuid = auth_token.key

	@property
	def api_key(self):
		if not hasattr(self, "_api_key"):
			from hearthsim.identity.api.models import APIKey as LegacyAPIKey
			if self.api_key_id:
				self._api_key = LegacyAPIKey.objects.get(id=self.api_key_id)
			else:
				self._api_key = None

		return self._api_key

	@api_key.setter
	def api_key(self, key):
		if key:
			self._api_key = key
			self.api_key_id = key.id

	@property
	def game(self):
		if not hasattr(self, "_game"):
			from hsreplaynet.games.models import GameReplay
			if self.game_id:
				try:
					self._game = GameReplay.objects.get(id=self.game_id)
				except GameReplay.DoesNotExist:
					self._game = None
			else:
				self._game = None

		return self._game

	@game.setter
	def game(self, g):
		if g:
			self._game = g
			self.game_id = g.id

	@property
	def cloudwatch_url(self):
		baseurl = "https://console.aws.amazon.com/cloudwatch/home"
		tpl = "?region=%s#logEventViewer:group=%s;stream=%s;start=%s;end=%s;tz=UTC"
		start = self.updated
		end = start + timedelta(minutes=3)
		return baseurl + tpl % (
			os.environ.get("AWS_DEFAULT_REGION", "us-east-1"),
			self.log_group_name,
			self.log_stream_name,
			start.strftime("%Y-%m-%dT%H:%M:%SZ"),
			end.strftime("%Y-%m-%dT%H:%M:%SZ")
		)

	@property
	def is_processing(self):
		return self.status in UploadEventStatus.processing_statuses()

	def get_absolute_url(self):
		return reverse("upload_detail", kwargs={"shortid": self.shortid})

	def get_admin_url(self):
		return reverse(
			"admin:%s_%s_change" % (self._meta.app_label, self._meta.model_name),
			args=[self.id]
		)

	def log_bytes(self):
		from botocore.vendored.requests.packages.urllib3.exceptions import ReadTimeoutError
		try:
			self.file.open(mode="rb")
		except ReadTimeoutError:
			# We wait one second and then give it a second attempt before we fail
			time.sleep(1)
			self.file.open(mode="rb")

		return self.file.read()

	def process(self):
		from hsreplaynet.games.processing import process_upload_event

		process_upload_event(self)


class RedshiftETLStage(IntEnum):
	ERROR = 0
	CREATED = 1
	INITIALIZING = 2
	INITIALIZED = 3
	ACTIVE = 4
	# Recently closed tracks go into quiescence until Firehose is fully flushed
	IN_QUIESCENCE = 5
	READY_TO_LOAD = 6
	GATHERING_STATS = 7
	GATHERING_STATS_COMPLETE = 8
	DEDUPLICATING = 9
	DEDUPLICATION_COMPLETE = 10
	INSERTING = 11
	INSERT_COMPLETE = 12
	REFRESHING_MATERIALIZED_VIEWS = 13
	REFRESHING_MATERIALIZED_VIEWS_COMPLETE = 14
	VACUUMING = 15
	VACUUM_COMPLETE = 16
	ANALYZING = 17
	ANALYZE_COMPLETE = 18
	CLEANING_UP = 19
	FINISHED = 20


class RedshiftStagingTrackManager(models.Manager):

	def do_maintenance(self):
		log.info("Starting Redshift ETL Maintenance Cycle")
		start_time = time.time()
		target_duration_seconds = 55
		duration = 0

		# We use this as a shared value so 2 ETL Lambdas never start concurrently
		LOCK_NAME = "REDSHIFT_ETL_MAINTENANCE_LOCK"
		NAMESPACE, ADVISORY_LOCK_ID = settings.ADVISORY_LOCK_NAMESPACES[LOCK_NAME]
		with advisory_lock([NAMESPACE, ADVISORY_LOCK_ID]) as acquired:
			if acquired:
				log.info("Lock acquired. Generating tasks...")
				with influx_timer("redshift_etl_task_generation_duration"):
					tasks = RedshiftStagingTrack.objects.get_ready_maintenance_tasks()

				if tasks:
					for task in tasks:
						remaining_seconds = target_duration_seconds - duration
						if remaining_seconds < 5:
							break

						current_available_slots = self.get_current_available_slots()
						log.info(
							"Currently available ETL slots: %i" % current_available_slots
						)
						if current_available_slots > 1:
							# If we want to by-pass the slot check we can add
							# this to the if clause or task._name.startswith("Cleanup")
							log.info("Next Task: %s" % str(task))
							task()
							log.info("Complete.")
						else:
							log.info("Not enough free etl slots will sleep.")
							time.sleep(5)
							current_time = time.time()
							duration = current_time - start_time
			else:
				log.info("Could not acquire lock. Will skip maintenance run.")

		log.info("Maintenance Cycle Complete")

	def get_current_available_slots(self):
		return self.get_available_etl_slots() - self.get_etl_queue_depth()

	def get_etl_queue_depth(self):
		query = """
			SELECT count(*)
			FROM stv_recents r
			WHERE r.status<>'Done' AND r.user_name='etl_user'
			AND r.pid NOT IN (SELECT i.pid FROM stv_inflight i);
		"""
		with redshift.get_redshift_engine(etl_user=True).connect() as conn:
			return conn.execute(query).scalar()

	def get_available_etl_slots(self):
		# This uses the view defined in scripts/sql/wlm_queue_views.sql
		q = """
			SELECT slots
			FROM WLM_QUEUE_STATE_VW
			WHERE description = '(user group: etl)';
			"""
		with redshift.get_redshift_engine(etl_user=True).connect() as conn:
			return conn.execute(q).scalar()

	def get_ready_maintenance_tasks(self):
		"""
		Return a list of callables that will each be invoked in sequence by the lambda.
		Each one must return within seconds to ensure the lambda finishes within 5 min.

		We attempt to generate tasks in reverse of the track's normal lifecycle in order
		to advance any in flight tracks to completion before initializing new tracks
		"""
		self.check_for_error_states()
		# The state of tracks in the uploads-db might be stale
		# Since long running queries kicked off against the cluster may have completed.
		# So first we refresh the state of the track
		operation_in_progress, operation_name, prefix = self.refresh_track_states()

		if operation_in_progress:
			log.info("%s is still %s" % (prefix, str(operation_name)))
			log.info("Will check for additional unstarted tasks")
			if operation_name == RedshiftETLStage.INITIALIZING:
				return self.attempt_continue_initializing_tasks()
			elif operation_name == RedshiftETLStage.GATHERING_STATS:
				return self.attempt_continue_gathering_stats_tasks()
			elif operation_name == RedshiftETLStage.VACUUMING:
				return self.attempt_continue_vacuum_tasks()
			elif operation_name == RedshiftETLStage.ANALYZING:
				return self.attempt_continue_analyzing_tasks()
			elif operation_name == RedshiftETLStage.INSERTING:
				return self.attempt_continue_inserting_tasks()
			elif operation_name == RedshiftETLStage.DEDUPLICATING:
				return self.attempt_continue_deduplicating_tasks()
			elif operation_name == RedshiftETLStage.REFRESHING_MATERIALIZED_VIEWS:
				return self.attempt_continue_refreshing_views_tasks()
			elif operation_name == RedshiftETLStage.CLEANING_UP:
				return self.attempt_continue_cleaning_up_tasks()
			else:
				log.info("Will wait until it has completed to initiate new tasks")
				return []

		# If we reach here then we know that we don't have any long running
		# operations in flight on the cluster.

		cleanup_tasks = self.get_cleanup_tasks()
		if cleanup_tasks:
			log.info("Found %s cleanup tasks" % str(len(cleanup_tasks)))
			return cleanup_tasks

		analyze_tasks = self.get_analyze_tasks()
		if analyze_tasks:
			log.info("Found %s analyze tasks" % str(len(analyze_tasks)))
			return analyze_tasks

		vacuum_tasks = self.get_vacuum_tasks()
		if vacuum_tasks:
			log.info("Found %s vacuum tasks" % str(len(vacuum_tasks)))
			return vacuum_tasks

		refresh_view_tasks = self.get_refresh_view_tasks()
		if refresh_view_tasks:
			log.info("Found %s refresh view tasks" % str(len(refresh_view_tasks)))
			return refresh_view_tasks

		insert_tasks = self.get_insert_tasks()
		if insert_tasks:
			log.info("Found %s insert tasks" % str(len(insert_tasks)))
			return insert_tasks

		deduplication_tasks = self.get_deduplication_tasks()
		if deduplication_tasks:
			log.info("Found %s deduplication tasks" % str(len(deduplication_tasks)))
			return deduplication_tasks

		gathering_stats_tasks = self.get_gathering_stats_tasks()
		if gathering_stats_tasks:
			log.info("Found %s gathering stats tasks" % str(len(gathering_stats_tasks)))
			return gathering_stats_tasks

		# Tack lifecycle tasks include initializing new tracks
		# And closing active tracks
		track_lifecycle_tasks = self.get_track_lifecycle_tasks()
		if track_lifecycle_tasks:
			log.info("Found %s track lifecycle tasks" % str(len(track_lifecycle_tasks)))
			return track_lifecycle_tasks

		# Nothing to do, so return empty list
		return []

	def check_for_error_states(self):
		error_track_count = RedshiftStagingTrack.objects.filter(
			stage__exact=RedshiftETLStage.ERROR
		).count()
		if error_track_count > 0:
			msg = "There are Error Tracks. They must be resolved before ETL can continue."
			raise RuntimeError(msg)

	def refresh_track_states(self):
		unfinished_tracks = RedshiftStagingTrack.objects.exclude(
			stage__in=(RedshiftETLStage.ERROR, RedshiftETLStage.FINISHED)
		).all()

		if unfinished_tracks:
			for unfinished_track in unfinished_tracks:
				in_progress, name = unfinished_track.refresh_track_state()
				if in_progress:
					return in_progress, name, unfinished_track.track_prefix

		return False, None, None

	def get_gathering_stats_tasks(self):
		track = RedshiftStagingTrack.objects.filter(
			stage=RedshiftETLStage.READY_TO_LOAD,
		).first()

		if track:
			track.stage = RedshiftETLStage.GATHERING_STATS
			track.gathering_stats_started_at = timezone.now()
			track.save()
			return track.get_gathering_stats_tasks()

	def attempt_continue_gathering_stats_tasks(self):
		track_for_continue = RedshiftStagingTrack.objects.filter(
			stage=RedshiftETLStage.GATHERING_STATS,
		).first()

		if track_for_continue:
			return track_for_continue.get_gathering_stats_tasks()

	def get_deduplication_tasks(self):
		track = RedshiftStagingTrack.objects.filter(
			stage=RedshiftETLStage.GATHERING_STATS_COMPLETE,
		).first()

		if track:
			track.stage = RedshiftETLStage.DEDUPLICATING
			track.deduplicating_started_at = timezone.now()
			track.save()
			return track.get_deduplication_tasks()

	def attempt_continue_deduplicating_tasks(self):
		track_for_continue = RedshiftStagingTrack.objects.filter(
			stage=RedshiftETLStage.DEDUPLICATING
		).first()

		if track_for_continue:
			return track_for_continue.get_deduplication_tasks()

	def get_insert_tasks(self):
		track = RedshiftStagingTrack.objects.filter(
			stage=RedshiftETLStage.DEDUPLICATION_COMPLETE,
		).first()

		if track:
			track.stage = RedshiftETLStage.INSERTING
			track.insert_started_at = timezone.now()
			track.save()
			return track.get_insert_tasks()

	def attempt_continue_inserting_tasks(self):
		track_for_continue = RedshiftStagingTrack.objects.filter(
			stage=RedshiftETLStage.INSERTING
		).first()

		if track_for_continue:
			return track_for_continue.get_insert_tasks()

	def get_refresh_view_tasks(self):
		track_for_refresh = RedshiftStagingTrack.objects.filter(
			stage=RedshiftETLStage.INSERT_COMPLETE,
		).first()

		if track_for_refresh:
			track_for_refresh.stage = RedshiftETLStage.REFRESHING_MATERIALIZED_VIEWS
			track_for_refresh.refreshing_view_start_at = timezone.now()
			track_for_refresh.save()
			return track_for_refresh.get_refresh_view_tasks()

	def attempt_continue_refreshing_views_tasks(self):
		track_for_continue = RedshiftStagingTrack.objects.filter(
			stage=RedshiftETLStage.REFRESHING_MATERIALIZED_VIEWS
		).first()

		if track_for_continue:
			return track_for_continue.get_refresh_view_tasks()

	def get_vacuum_tasks(self):
		track_for_vacuum = RedshiftStagingTrack.objects.filter(
			stage=RedshiftETLStage.REFRESHING_MATERIALIZED_VIEWS_COMPLETE,
		).first()

		if track_for_vacuum:
			track_for_vacuum.stage = RedshiftETLStage.VACUUMING
			track_for_vacuum.vacuum_started_at = timezone.now()
			track_for_vacuum.save()
			return track_for_vacuum.get_vacuum_tasks()

	def attempt_continue_vacuum_tasks(self):
		track_for_continue = RedshiftStagingTrack.objects.filter(
			stage=RedshiftETLStage.VACUUMING,
		).first()

		if track_for_continue:
			return track_for_continue.attempt_get_next_vacuum_task()

	def get_analyze_tasks(self):
		track_for_analyze = RedshiftStagingTrack.objects.filter(
			stage=RedshiftETLStage.VACUUM_COMPLETE,
		).first()

		if track_for_analyze:
			track_for_analyze.stage = RedshiftETLStage.ANALYZING
			track_for_analyze.analyze_started_at = timezone.now()
			track_for_analyze.save()
			return track_for_analyze.get_analyze_tasks()

	def attempt_continue_analyzing_tasks(self):
		track_for_continue = RedshiftStagingTrack.objects.filter(
			stage=RedshiftETLStage.ANALYZING
		).first()

		if track_for_continue:
			return track_for_continue.get_analyze_tasks()

	def get_cleanup_tasks(self):

		track_for_cleanup = RedshiftStagingTrack.objects.filter(
			stage=RedshiftETLStage.ANALYZE_COMPLETE,
		).first()

		if track_for_cleanup:
			track_for_cleanup.stage = RedshiftETLStage.CLEANING_UP
			track_for_cleanup.track_cleanup_start_at = timezone.now()
			track_for_cleanup.save()
			return track_for_cleanup.get_cleanup_tasks()

	def attempt_continue_cleaning_up_tasks(self):
		track_for_cleanup = RedshiftStagingTrack.objects.filter(
			stage=RedshiftETLStage.CLEANING_UP
		).first()

		if track_for_cleanup:
			return track_for_cleanup.get_cleanup_tasks()

	def get_track_lifecycle_tasks(self):
		track = RedshiftStagingTrack.objects.filter(
			stage=RedshiftETLStage.ACTIVE,
		).first()

		if track:
			current_duration = track.activate_duration_minutes
			log.info("The active track has been open for %s minutes" % current_duration)
			target_duration = settings.REDSHIFT_ETL_TRACK_TARGET_ACTIVE_DURATION_MINUTES
			log.info("Target active duration minutes is: %s" % target_duration)

			if track.track_should_close:
				log.info("The active track should close.")
				if track.is_able_to_close:
					if not track.successor:
						log.info("No successor yet. One will be initialized.")
						return [track.get_initialize_successor_tasks()]
					else:
						if track.successor.is_ready_to_become_active:
							log.info("The successor is ready to become active.")
							log.info("Will generate a make active task")
							return [track.get_make_active_task()]
						else:
							log.info("The successor is not ready to become active yet.")
							log.info("Will wait until successor is ready.")
				else:
					log.info("The predecessor track is not finished.")
					log.info("Active track will not close until predecessor completes")
			else:
				log.info("The active track is okay. No lifecycle work required")

	def get_active_track_prefix(self):
		# This will be called by each lambda
		# And provided when initializing the RedshiftExporter
		active_track = self.get_active_track()
		if active_track:
			return active_track.track_prefix
		else:
			return ""

	def get_active_track(self):
		return RedshiftStagingTrack.objects.filter(
			closed_at__isnull=True,
			active_at__isnull=False
		).order_by("-active_at").first()

	def initialize_first_active_track(self):
		# This should only get called when we are bootstrapping
		# And setting up our first active track.
		# At all other times, there should always be an active track
		track = RedshiftStagingTrack.objects.create(
			track_prefix=self.generate_track_prefix(),
			# This is ONLY immediately set on record create for the initial root track
			active_at=timezone.now()
		)
		track.initialize_tables()

		for table in track.tables.all():
			table.stage = RedshiftETLStage.ACTIVE
		track.stage = RedshiftETLStage.ACTIVE
		track.save()

		return track

	def create_successor_for(self, existing_track):
		current_prefix = existing_track.track_prefix
		proposed_prefix = self.generate_track_prefix()
		# we want to prevent two subsequent tracks with the same prefix
		while proposed_prefix == current_prefix:
			proposed_prefix = self.generate_track_prefix()
		successor = RedshiftStagingTrack.objects.create(
			predecessor=existing_track,
			track_prefix=proposed_prefix
		)
		existing_track.successor = successor
		existing_track.save()

		successor.initialize_tables()

		return successor

	def attempt_continue_initializing_tasks(self):
		active_track = self.get_active_track()
		successor = active_track.successor
		if not successor or successor.stage != RedshiftETLStage.INITIALIZING:
			raise RuntimeError("Successor must exist and be initializing.")

		tmpl = "Initializing successor for track_prefix: %s"
		task_name = tmpl % (active_track.track_prefix,)
		return [RedshiftETLTask(task_name, successor.initialize_tables)]

	def generate_track_prefix(self):
		staging_prefix = "stage"
		track_uuid = str(uuid4())[:4]
		return "%s_%s_" % (staging_prefix, track_uuid)


class RedshiftStagingTrack(models.Model):
	"""
	Represents a collection of staging tables intended for micro-batch loading into Redshift.
	"""

	id = models.BigAutoField(primary_key=True)
	objects = RedshiftStagingTrackManager()
	predecessor = models.ForeignKey(
		"self",
		null=True,
		on_delete=models.SET_NULL,
		related_name="+"
	)
	successor = models.ForeignKey(
		"self",
		null=True,
		on_delete=models.SET_NULL,
		related_name="+"
	)
	track_prefix = models.CharField("Track Prefix", max_length=100)
	created = models.DateTimeField(auto_now_add=True)
	close_requested = models.BooleanField(default=False)
	stage = IntEnumField(enum=RedshiftETLStage, default=RedshiftETLStage.CREATED)

	active_at = models.DateTimeField(null=True, db_index=True)
	closed_at = models.DateTimeField(null=True, db_index=True)
	gathering_stats_started_at = models.DateTimeField(null=True)
	gathering_stats_ended_at = models.DateTimeField(null=True)
	deduplicating_started_at = models.DateTimeField(null=True)
	deduplicating_ended_at = models.DateTimeField(null=True)
	insert_started_at = models.DateTimeField(null=True)
	insert_ended_at = models.DateTimeField(null=True)
	refreshing_view_start_at = models.DateTimeField(null=True)
	refreshing_view_end_at = models.DateTimeField(null=True)
	vacuum_started_at = models.DateTimeField(null=True)
	vacuum_ended_at = models.DateTimeField(null=True)
	analyze_started_at = models.DateTimeField(null=True)
	analyze_ended_at = models.DateTimeField(null=True)
	track_cleanup_start_at = models.DateTimeField(null=True)
	track_cleanup_end_at = models.DateTimeField(null=True)

	@property
	def activate_duration_minutes(self):
		current_timestamp = timezone.now()
		duration = current_timestamp - self.active_at
		return duration.seconds / 60

	@property
	def min_game_date(self):
		min_date = None
		for t in self.tables.all():
			if t.min_game_date and not min_date:
				min_date = t.min_game_date
			if t.min_game_date and min_date and t.min_game_date < min_date:
				min_date = t.min_game_date
		return min_date

	@property
	def max_game_date(self):
		max_date = None
		for t in self.tables.all():
			if t.max_game_date and not max_date:
				max_date = t.max_game_date
			if t.max_game_date and max_date and t.max_game_date > max_date:
				max_date = t.max_game_date
		return max_date

	@property
	def is_in_quiescence(self):
		# We require that a track wait a minimum amount of time before inserting the records
		# To insure that any straggling records in Firehose have been flushed to the table
		min_wait = self.quiescence_duration_minimum
		return self.quiescence_duration_seconds <= min_wait

	@property
	def quiescence_duration_minimum(self):
		return settings.REDSHIFT_ETL_CLOSED_TRACK_MINIMUM_QUIESCENCE_SECONDS

	@property
	def quiescence_duration_seconds(self):
		time_since_close = timezone.now() - self.closed_at
		return time_since_close.seconds

	@property
	def track_should_close(self):
		target_active_duration = settings.REDSHIFT_ETL_TRACK_TARGET_ACTIVE_DURATION_MINUTES
		target_duration_exceeded = self.activate_duration_minutes >= target_active_duration
		return target_duration_exceeded or self.close_requested

	@property
	def successor_is_ready(self):
		if self.successor and self.successor.firehose_streams_are_active:
			return True

		return False

	@property
	def is_ready_to_become_active(self):
		has_child_tables = self.tables.count() > 0
		child_streams_are_active = self.firehose_streams_are_active
		predecessor_can_close = self.predecessor.is_able_to_close
		return has_child_tables and child_streams_are_active and predecessor_can_close

	@property
	def is_active(self):
		return self.closed_at is None

	@property
	def firehose_streams_are_active(self):
		return all(
			map(
				lambda t: t.firehose_stream_is_active,
				self.tables.filter(is_materialized_view=False).all()
			)
		)

	@property
	def is_able_to_close(self):
		# We cannot close an active track
		# If that track's predecessor's records have still not been transfered
		# We must finish transfering a previously closed track's records
		# Before we attempt to close another track.

		if not self.predecessor:
			# The initial active_track will not have a predecessor
			return True

		return self.predecessor.is_complete

	@property
	def is_able_to_insert(self):
		is_closed = self.closed_at is not None
		is_not_inserted = self.insert_started_at is None
		is_not_in_quiescence = not self.is_in_quiescence

		return is_closed and is_not_inserted and is_not_in_quiescence

	@property
	def is_able_to_analyze(self):
		return self.insert_ended_at is not None

	@property
	def is_able_to_vacuum(self):
		return self.analyze_ended_at is not None

	@property
	def is_able_to_cleanup(self):
		return self.vacuum_ended_at is not None

	@property
	def is_complete(self):
		# This should return True once all records have been transfered
		# To the production tables, and the firehose streams have been destroyed
		return self.stage == RedshiftETLStage.FINISHED

	@property
	def is_able_to_initialize_successor(self):
		# We can only have so many tracks at the same time do to
		# Firehose limits so check to make sure we aren't exceeding that.
		initialized_tracks = RedshiftStagingTrack.objects.filter(
			track_cleanup_end_at__isnull=True
		).count()
		concurrent_limit = settings.REDSHIFT_ETL_CONCURRENT_TRACK_LIMIT
		return initialized_tracks < concurrent_limit

	def reset_to_stage(self, stage):
		for table in self.tables.all():
			table.reset_to_stage(stage)

		self.stage = stage

		if int(stage) < int(RedshiftETLStage.CLEANING_UP):
			self.track_cleanup_end_at = None
			self.track_cleanup_start_at = None

		if int(stage) < int(RedshiftETLStage.ANALYZE_COMPLETE):
			self.analyze_started_at = None
			self.analyze_ended_at = None

		if int(stage) < int(RedshiftETLStage.VACUUM_COMPLETE):
			self.vacuum_started_at = None
			self.vacuum_ended_at = None

		if int(stage) < int(RedshiftETLStage.REFRESHING_MATERIALIZED_VIEWS_COMPLETE):
			self.refreshing_view_start_at = None
			self.refreshing_view_end_at = None

		if int(stage) < int(RedshiftETLStage.INSERT_COMPLETE):
			self.insert_started_at = None
			self.insert_ended_at = None

		if int(stage) < int(RedshiftETLStage.DEDUPLICATION_COMPLETE):
			self.deduplicating_started_at = None
			self.deduplicating_ended_at = None

		if int(stage) < int(RedshiftETLStage.GATHERING_STATS_COMPLETE):
			self.gathering_stats_started_at = None
			self.gathering_stats_ended_at = None

		self.save()

	def is_currently_processing(self):
		no_longer_active = self.stage >= RedshiftETLStage.IN_QUIESCENCE
		not_finished = self.stage < RedshiftETLStage.FINISHED
		return no_longer_active and not_finished

	def heartbeat_track_status_metrics(self):
		for table in self.tables.all():
			table.heartbeat_track_status_metrics()

	def capture_track_finished_metrics(self):
		if self.stage != RedshiftETLStage.FINISHED:
			raise RuntimeError("Cannot call on unfinished tracks.")

		processing_start = self.gathering_stats_started_at
		processing_end = self.track_cleanup_end_at

		processing_duration = (processing_end - processing_start).seconds
		active_duration = (self.closed_at - self.active_at).seconds

		active_seconds_per_processing_second = (1.0 * active_duration) / processing_duration

		influx_metric(
			"redshift_etl_track_total_processing_seconds",
			{
				"seconds": processing_duration,
				"track_id": self.id
			}
		)
		influx_metric(
			"redshift_etl_active_seconds_to_processing_seconds_ratio",
			{
				"seconds": active_seconds_per_processing_second,
				"track_id": self.id
			}
		)

		for table in self.tables.all():
			table.capture_track_finished_metrics()

	def schedule_global_query_cache_warming(self):
		from hsreplaynet.analytics.processing import fill_global_query_queue
		fill_global_query_queue()

	def _all_staging_tables_are_empty(self):
		return all(t.is_empty() for t in self.tables.all() if not t.is_materialized_view)

	def refresh_track_state(self):
		if self.stage == RedshiftETLStage.ERROR:
			# We never automatically move a track out of error once it has
			# entered an error stage. This must be done manually.
			raise RuntimeError("Refresh should never get called on errored tracks")

		if self.stage == RedshiftETLStage.INITIALIZING:
			return True, RedshiftETLStage.INITIALIZING

		for table in self.tables.all():
			# If the table previously launched a long running operation
			# This is where we check to see if completed.
			table.refresh_table_state()

		if self._all_staging_tables_are_empty():
			# If all the staging tables have no data
			# The likely processing was paused for the entire track ETL cycle
			# So we can short circuit this track to the cleanup stage.
			for table in self.tables.all():
				if table.stage < RedshiftETLStage.ANALYZE_COMPLETE:
					table.stage = RedshiftETLStage.ANALYZE_COMPLETE
					table.save()

		if self._all_tables_are_in_stage(RedshiftETLStage.FINISHED):
			# If all the child tables are finished, then the track is always finished.
			self.stage = RedshiftETLStage.FINISHED
			self.track_cleanup_end_at = timezone.now()
			self.save()
			self.capture_track_finished_metrics()
			# self.schedule_global_query_cache_warming()
			return False, None

		if self.stage == RedshiftETLStage.CLEANING_UP:
			return True, RedshiftETLStage.CLEANING_UP

		if self._all_tables_are_in_stage(RedshiftETLStage.ANALYZE_COMPLETE):
			self.stage = RedshiftETLStage.ANALYZE_COMPLETE
			self.analyze_ended_at = timezone.now()
			self.save()

		if self.stage == RedshiftETLStage.ANALYZING:
			return True, RedshiftETLStage.ANALYZING

		if self._all_tables_are_in_stage(RedshiftETLStage.VACUUM_COMPLETE):
			self.stage = RedshiftETLStage.VACUUM_COMPLETE
			self.vacuum_ended_at = timezone.now()
			self.save()

		if self.stage == RedshiftETLStage.VACUUMING:
			return True, RedshiftETLStage.VACUUMING

		views_complete = RedshiftETLStage.REFRESHING_MATERIALIZED_VIEWS_COMPLETE
		if self._all_tables_are_in_stage(views_complete):
			self.stage = RedshiftETLStage.REFRESHING_MATERIALIZED_VIEWS_COMPLETE
			self.refreshing_view_end_at = timezone.now()
			self.save()

		if self.stage == RedshiftETLStage.REFRESHING_MATERIALIZED_VIEWS:
			return True, RedshiftETLStage.REFRESHING_MATERIALIZED_VIEWS

		if self._all_tables_are_in_stage(RedshiftETLStage.INSERT_COMPLETE):
			self.stage = RedshiftETLStage.INSERT_COMPLETE
			self.insert_ended_at = timezone.now()
			self.save()

		if self.stage == RedshiftETLStage.INSERTING:
			return True, RedshiftETLStage.INSERTING

		if self._all_tables_are_in_stage(RedshiftETLStage.DEDUPLICATION_COMPLETE):
			self.stage = RedshiftETLStage.DEDUPLICATION_COMPLETE
			self.deduplicating_ended_at = timezone.now()
			self.save()

		if self.stage == RedshiftETLStage.DEDUPLICATING:
			return True, RedshiftETLStage.DEDUPLICATING

		if self._all_tables_are_in_stage(RedshiftETLStage.GATHERING_STATS_COMPLETE):
			self.stage = RedshiftETLStage.GATHERING_STATS_COMPLETE
			self.gathering_stats_ended_at = timezone.now()
			self.save()

		if self.stage == RedshiftETLStage.GATHERING_STATS:
			return True, RedshiftETLStage.GATHERING_STATS

		if self.stage == RedshiftETLStage.IN_QUIESCENCE and not self.is_in_quiescence:
			self.stage = RedshiftETLStage.READY_TO_LOAD
			for t in self.tables.all():
				t.stage = RedshiftETLStage.READY_TO_LOAD
				t.save()
			self.save()

		if self.stage == RedshiftETLStage.IN_QUIESCENCE:
			return True, RedshiftETLStage.IN_QUIESCENCE

		return False, None

	def _any_tables_are_in_stage(self, stage):
		return any(map(lambda t: t.stage == stage, self.tables.all()))

	def _all_tables_are_in_stage(self, stage):
		return all(map(lambda t: t.stage == stage, self.tables.all()))

	def initialize_successor(self):
		if not self.is_able_to_initialize_successor:
			raise RuntimeError("At Concurrent Track Limit. Cannot initialize another track.")

		if self.successor:
			raise RuntimeError("Successor already exists")

		return RedshiftStagingTrack.objects.create_successor_for(self)

	def initialize_tables(self):

		self.stage = RedshiftETLStage.INITIALIZING
		self.save()

		RedshiftStagingTrackTable.objects.create_tables_for_track(
			list_staging_eligible_tables(),
			self
		)

		for view in get_materialized_view_list():
			RedshiftStagingTrackTable.objects.create_view_table_for_track(
				view,
				self
			)

		self.stage = RedshiftETLStage.INITIALIZED
		self.save()

	def make_active(self):
		if self.active_at is not None:
			raise RuntimeError("This track is already active")

		if not self.firehose_streams_are_active:
			raise RuntimeError("Firehose streams are not active")

		with transaction.atomic():
			current_timestamp = timezone.now()
			self.active_at = current_timestamp
			self.stage = RedshiftETLStage.ACTIVE
			for table in self.tables.all():
				table.stage = RedshiftETLStage.ACTIVE
				table.save()
			self.save()

			self.predecessor.closed_at = current_timestamp
			self.predecessor.stage = RedshiftETLStage.IN_QUIESCENCE
			for table in self.predecessor.tables.all():
				table.stage = RedshiftETLStage.IN_QUIESCENCE
				table.save()

			self.predecessor.save()

		return current_timestamp

	def get_gathering_stats_tasks(self):
		results = []
		for t in self.tables.all():
			if t.stage == RedshiftETLStage.READY_TO_LOAD:
				if t.is_materialized_view:
					t.stage = RedshiftETLStage.GATHERING_STATS_COMPLETE
					t.gathering_stats_started_at = timezone.now()
					t.gathering_stats_ended_at = t.gathering_stats_started_at
					t.save()
					t.heartbeat_track_status_metrics()
				else:
					results.append(t.get_gathering_stats_task())
		return results

	def get_deduplication_tasks(self):
		results = []
		for t in self.tables.all():
			if t.stage == RedshiftETLStage.GATHERING_STATS_COMPLETE:
				if t.is_materialized_view:
					t.stage = RedshiftETLStage.DEDUPLICATION_COMPLETE
					t.deduplicating_started_at = timezone.now()
					t.deduplicating_ended_at = t.deduplicating_started_at
					t.save()
				else:
					results.append(t.get_deduplication_task())
		return results

	def get_insert_tasks(self):
		results = []
		for t in self.tables.all():
			if t.stage == RedshiftETLStage.DEDUPLICATION_COMPLETE:
				if t.is_materialized_view:
					t.stage = RedshiftETLStage.INSERT_COMPLETE
					t.inserting_started_at = timezone.now()
					t.inserting_ended_at = t.inserting_started_at
					t.save()
				else:
					results.append(t.get_insert_task())
		return results

	def get_refresh_view_tasks(self):
		results = []
		for t in self.tables.all():
			if t.stage == RedshiftETLStage.INSERT_COMPLETE:
				if t.is_materialized_view:
					# This allows views to depend on other views in their refresh logic.
					dependent_views = get_view_dependencies(t.target_table)

					dependencies_met = True
					for dependent_view in dependent_views:
						table_for_view = self.tables.filter(target_table=dependent_view).first()
						required_stage = RedshiftETLStage.REFRESHING_MATERIALIZED_VIEWS_COMPLETE
						if table_for_view.stage != required_stage:
							dependencies_met = False

					if dependencies_met:
						results.append(t.get_refresh_view_task())
				else:
					t.stage = RedshiftETLStage.REFRESHING_MATERIALIZED_VIEWS_COMPLETE
					t.refreshing_materialized_views_started_at = timezone.now()
					t.refreshing_materialized_views_ended_at = t.refreshing_materialized_views_started_at
					t.save()
		return results

	def get_vacuum_tasks(self):
		# Vacuuming can only proceed one table at a time.
		for table in self.tables.all():
			if table.stage == RedshiftETLStage.REFRESHING_MATERIALIZED_VIEWS_COMPLETE:
				return [table.get_vacuum_task()]
		return []

	def attempt_get_next_vacuum_task(self):
		if self._any_tables_are_in_stage(RedshiftETLStage.VACUUMING):
			# Don't start any additional vacuums while one is still in flight
			return []
		# If none are in flight then get the next task
		return self.get_vacuum_tasks()

	def get_analyze_tasks(self):
		results = []
		for t in self.tables.all():
			if t.stage == RedshiftETLStage.VACUUM_COMPLETE:
				results.append(t.get_analyze_task())
		return results

	def get_cleanup_tasks(self):
		results = []
		for t in self.tables.all():
			if t.stage in (RedshiftETLStage.ANALYZE_COMPLETE, RedshiftETLStage.CLEANING_UP):
				if t.is_materialized_view:
					t.stage = RedshiftETLStage.FINISHED
					t.cleaning_up_started_at = timezone.now()
					t.cleaning_up_ended_at = t.cleaning_up_started_at
					t.save()
				else:
					results.append(t.get_cleanup_task())
		return results

	def get_initialize_successor_tasks(self):
		tmpl = "Initializing successor for track_prefix: %s"
		task_name = tmpl % (self.track_prefix,)
		return RedshiftETLTask(task_name, self.initialize_successor)

	def get_make_active_task(self):
		tmpl = "Making successor %s active and closing track: %s"
		task_name = tmpl % (self.successor.track_prefix, self.track_prefix)
		return RedshiftETLTask(task_name, self.successor.make_active)


class RedshiftStagingTrackTableManager(models.Manager):

	def create_view_table_for_track(self, view, track):

		# Create the record once we know the table and stream creation didn't error
		track_table, created = RedshiftStagingTrackTable.objects.get_or_create(
			track=track,
			target_table=view,
			is_materialized_view=True,
			stage=RedshiftETLStage.INITIALIZED,
		)

		return track_table

	def staging_table_exists(self, staging_table_name, refresh=True):
		return staging_table_name in get_redshift_metadata(refresh).tables

	def create_tables_for_track(self, tables, track):
		get_redshift_metadata(refresh=True)
		for table in tables:
			self.create_table_for_track(table, track, refresh=False)

	def create_table_for_track(self, table, track, refresh=True):
		staging_table_name = track.track_prefix + table.name
		# Create the staging table in redshift
		if not self.staging_table_exists(staging_table_name, refresh):
			staging_table_name = create_staging_table(
				table,
				track.track_prefix,
				redshift.get_redshift_engine(etl_user=True)
			)

		# Create the firehose stream
		if not streams.does_stream_exist(staging_table_name):
			streams.create_firehose_stream(
				staging_table_name,
				staging_table_name
			)

		# Create the record once we know the table and stream creation didn't error
		track_table, created = RedshiftStagingTrackTable.objects.get_or_create(
			track=track,
			target_table=table.name,
			staging_table=staging_table_name,
			firehose_stream=staging_table_name,
			stage=RedshiftETLStage.INITIALIZED,
		)

		return track_table


class RedshiftETLTask(object):

	def __init__(self, name, callable):
		self._name = name
		self._callable = callable

	def __str__(self):
		return self._name

	def __call__(self, *args, **kwargs):
		return self._callable(*args, **kwargs)


class RedshiftStagingTrackTable(models.Model):
	"""
	Represents a single staging table that is part of a micro-batch loading track.
	"""

	id = models.BigAutoField(primary_key=True)
	objects = RedshiftStagingTrackTableManager()
	track = models.ForeignKey(
		RedshiftStagingTrack,
		on_delete=models.CASCADE,
		related_name="tables"
	)
	stage = IntEnumField(enum=RedshiftETLStage, default=RedshiftETLStage.CREATED)
	firehose_stream = models.CharField("Firehose Stream", max_length=100)
	staging_table = models.CharField("Staging Table", max_length=100)
	target_table = models.CharField("Target Table", max_length=100)
	# Materialized Views don't have staging tables, they just have an update task
	# that gets run after the stage tables are all inserted
	is_materialized_view = models.BooleanField(default=False)
	final_staging_table_size = models.BigIntegerField(null=True)
	deduped_table_size = models.BigIntegerField(null=True)
	pre_insert_table_size = models.BigIntegerField(null=True)
	post_insert_table_size = models.BigIntegerField(null=True)

	min_game_date = models.DateField(null=True)
	max_game_date = models.DateField(null=True)

	gathering_stats_handle = models.CharField(max_length=15, blank=True)
	gathering_stats_started_at = models.DateTimeField(null=True)
	gathering_stats_ended_at = models.DateTimeField(null=True)

	dedupe_query_handle = models.CharField(max_length=15, blank=True)
	deduplicating_started_at = models.DateTimeField(null=True)
	deduplicating_ended_at = models.DateTimeField(null=True)

	insert_query_handle = models.CharField(max_length=15, blank=True)
	inserting_started_at = models.DateTimeField(null=True)
	inserting_ended_at = models.DateTimeField(null=True)

	refreshing_view_handle = models.CharField(max_length=15, blank=True)
	refreshing_materialized_views_started_at = models.DateTimeField(null=True)
	refreshing_materialized_views_ended_at = models.DateTimeField(null=True)

	vacuum_query_handle = models.CharField(max_length=15, blank=True)
	vacuuming_started_at = models.DateTimeField(null=True)
	vacuuming_ended_at = models.DateTimeField(null=True)

	analyze_query_handle = models.CharField(max_length=15, blank=True)
	analyzing_started_at = models.DateTimeField(null=True)
	analyzing_ended_at = models.DateTimeField(null=True)

	cleaning_up_started_at = models.DateTimeField(null=True)
	cleaning_up_ended_at = models.DateTimeField(null=True)

	class Meta:
		unique_together = ("track", "target_table")

	def is_empty(self):
		has_size = self.final_staging_table_size is not None
		return has_size and self.final_staging_table_size == 0

	@property
	def firehose_stream_is_active(self):
		description = streams.get_delivery_stream_description(self.firehose_stream)
		return description["DeliveryStreamStatus"] == "ACTIVE"

	@property
	def pre_insert_table_name(self):
		return "pre_%s" % self.staging_table

	def get_gathering_stats_task(self):
		tmpl = "Gathering stats for %s for track_prefix: %s"
		task_name = tmpl % (self.target_table, self.track.track_prefix)
		return RedshiftETLTask(task_name, self.do_gathering_stats)

	def do_gathering_stats(self):
		self.gathering_stats_handle = self._make_async_query_handle()
		self.save()
		self.heartbeat_track_status_metrics()

		msg = "Gathering stats for %s table for track %s with handle %s"
		log.info(msg % (
			self.target_table,
			self.track.track_prefix,
			self.gathering_stats_handle
		))

		self.record_final_staging_table_size()
		if self.final_staging_table_size:
			self.get_min_max_game_dates_from_staging_table()

			engine = redshift.get_redshift_engine(etl_user=True)
			stmt = "ANALYZE %s;" % self.staging_table
			run_redshift_background_statement(
				stmt,
				self.gathering_stats_handle,
				engine,
			)

			self.stage = RedshiftETLStage.GATHERING_STATS
			self.set_stage_started_at(
				RedshiftETLStage.GATHERING_STATS,
				timezone.now()
			)
			self.save()

		else:
			# When there are no records in the table, then just inherit from the parent to be safe
			# There is no need to analyze since there are no records in the table.
			self.min_game_date = self.track.min_game_date
			self.max_game_date = self.track.max_game_date
			self.stage = RedshiftETLStage.GATHERING_STATS_COMPLETE
			self.save()

	def get_deduplication_task(self):
		tmpl = "Deduplicating %s for track_prefix: %s"
		task_name = tmpl % (self.target_table, self.track.track_prefix)
		return RedshiftETLTask(task_name, self.do_deduplicate_records)

	def do_deduplicate_records(self):
		self.dedupe_query_handle = self._make_async_query_handle()
		self.save()
		self.heartbeat_track_status_metrics()

		msg = "Deduplicating %s table for track %s with handle %s"
		log.info(msg % (
			self.target_table,
			self.track.track_prefix,
			self.dedupe_query_handle
		))

		table_obj = self._get_table_obj()

		# Don't attempt deduplication if there is nothing in the staging table
		if self.final_staging_table_size:
			pre_table_name = self.pre_insert_table_name
			game_id_val = "id" if self.target_table == "game" else "game_id"
			column_names = ', '.join(['"%s"' % c.name for c in table_obj.columns])  # NOQA

			template1 = """
			DROP TABLE IF EXISTS {pre_table};
			"""

			template2 = """
			CREATE TABLE {pre_table_name} (LIKE {target_table_name});
			"""

			template3 = """
			INSERT INTO {pre_table}
			SELECT {column_names} FROM (
				SELECT
				ROW_NUMBER() OVER (PARTITION BY s.{game_id}, s.id ORDER BY s.id) AS rn,
				s.*
				FROM {staging_table} s
			) t WHERE rn = 1; ANALYZE {pre_table};
			"""

			sql1 = template1.format(
				pre_table=pre_table_name
			)

			sql2 = template2.format(
				pre_table_name=pre_table_name,
				target_table_name=self.target_table
			)

			sql3 = template3.format(
				pre_table=pre_table_name,
				column_names=column_names,
				game_id=game_id_val,
				staging_table=self.staging_table
			)

			engine = redshift.get_redshift_engine(etl_user=True)
			engine.execute(sql1)
			engine.execute(sql2)

			run_redshift_background_statement(
				sql3,
				self.dedupe_query_handle,
				engine
			)

			self.stage = RedshiftETLStage.DEDUPLICATING
			self.set_stage_started_at(
				RedshiftETLStage.DEDUPLICATING,
				timezone.now()
			)
			self.save()

	def get_insert_task(self):
		tmpl = "Inserting %s for track_prefix: %s"
		task_name = tmpl % (self.target_table, self.track.track_prefix)
		return RedshiftETLTask(task_name, self.do_insert_staged_records)

	def do_insert_staged_records(self):
		# If either of these time out the lambda, we want to attempt them again
		# At the start of the next lambda
		self.record_deduped_table_size()
		self.record_pre_insert_prod_table_size()

		self.insert_query_handle = self._make_async_query_handle()
		self.save()
		self.heartbeat_track_status_metrics()

		msg = "Inserting into %s table for track %s with handle %s"
		log.info(msg % (
			self.target_table,
			self.track.track_prefix,
			self.insert_query_handle
		))

		template = """
			INSERT INTO {target_table}
			SELECT s.*
			FROM {pre_staging_table} s
			LEFT JOIN {target_table} t ON t.{game_id} = s.{game_id}
				AND t.id = s.id AND t.game_date BETWEEN '{min_date}' AND '{max_date}'
			WHERE t.id IS NULL;
		"""

		if self.final_staging_table_size:
			# Don't attempt to insert if there is nothing in the staging table
			game_id_val = "id" if self.target_table == "game" else "game_id"
			pre_staging_table_name = self.pre_insert_table_name

			sql = template.format(
				pre_staging_table=pre_staging_table_name,
				target_table=self.target_table,
				min_date=self.min_game_date.isoformat(),
				max_date=self.max_game_date.isoformat(),
				game_id=game_id_val
			)

			engine = redshift.get_redshift_engine(etl_user=True)
			run_redshift_background_statement(
				sql,
				self.insert_query_handle,
				engine
			)

			self.stage = RedshiftETLStage.INSERTING
			self.set_stage_started_at(
				RedshiftETLStage.INSERTING,
				timezone.now()
			)
			self.save()

	def get_refresh_view_task(self):
		task_name = "Refreshing View %s" % self.target_table
		return RedshiftETLTask(task_name, self.do_refresh_view)

	def do_refresh_view(self):
		self.refreshing_view_handle = self._make_async_query_handle()
		self.save()
		self.heartbeat_track_status_metrics()

		msg = "Refreshing view %s for track %s with handle %s"
		log.info(msg % (
			self.target_table,
			self.track.track_prefix,
			self.refreshing_view_handle
		))

		min_date = self.track.min_game_date
		max_date = self.track.max_game_date
		if min_date and max_date:
			sql = get_materialized_view_update_statement(
				self.target_table,
				min_date,
				max_date
			)

			engine = redshift.get_redshift_engine(etl_user=True)
			run_redshift_background_statement(
				sql,
				self.refreshing_view_handle,
				engine
			)

			self.stage = RedshiftETLStage.REFRESHING_MATERIALIZED_VIEWS
			self.set_stage_started_at(
				RedshiftETLStage.REFRESHING_MATERIALIZED_VIEWS,
				timezone.now()
			)
			self.save()

	def get_vacuum_task(self):
		tmpl = "Vacuuming %s for track_prefix: %s"
		task_name = tmpl % (self.target_table, self.track.track_prefix)
		return RedshiftETLTask(task_name, self.do_vacuum)

	def do_vacuum(self):
		# If this times out e.g. entity_state we want to be able to try again
		# at the start of the next lambda
		self.record_post_insert_prod_table_size()

		self.vacuum_query_handle = self._make_async_query_handle()
		self.save()
		self.heartbeat_track_status_metrics()

		if self.vacuum_is_needed():
			msg = "Vacuuming %s table for track %s with handle %s"
			log.info(msg % (
				self.target_table,
				self.track.track_prefix,
				self.vacuum_query_handle
			))

			vacuum_target = 100 - settings.REDSHIFT_PCT_UNSORTED_ROWS_TOLERANCE
			engine = redshift.get_redshift_engine(etl_user=True)
			available_slots = RedshiftStagingTrack.objects.get_current_available_slots()
			sql = """
				SET wlm_query_slot_count TO %i;
				VACUUM FULL %s TO %i PERCENT;
				SET wlm_query_slot_count TO 1;
			""" % (available_slots, self.target_table, vacuum_target)
			run_redshift_background_statement(
				sql,
				self.vacuum_query_handle,
				engine,
				auto_commit=True
			)

			self.stage = RedshiftETLStage.VACUUMING
			self.set_stage_started_at(
				RedshiftETLStage.VACUUMING,
				timezone.now()
			)
			self.save()

		else:
			log.info("Unsorted row count is not large enough. Skipping vacuum.")
			self.vacuuming_ended_at = timezone.now()
			self.stage = RedshiftETLStage.VACUUM_COMPLETE
			self.save()
			self.heartbeat_track_status_metrics()

	def get_analyze_task(self):
		tmpl = "Analyzing %s for track_prefix: %s"
		task_name = tmpl % (self.target_table, self.track.track_prefix)
		return RedshiftETLTask(task_name, self.do_analyze)

	def do_analyze(self):
		self.analyze_query_handle = self._make_async_query_handle()
		self.save()
		self.heartbeat_track_status_metrics()

		msg = "Analyzing %s table for track %s with handle %s"
		log.info(msg % (
			self.target_table,
			self.track.track_prefix,
			self.analyze_query_handle
		))

		engine = redshift.get_redshift_engine(etl_user=True)
		sql = "ANALYZE %s;" % self.target_table
		run_redshift_background_statement(
			sql,
			self.analyze_query_handle,
			engine
		)

		self.stage = RedshiftETLStage.ANALYZING
		self.set_stage_started_at(
			RedshiftETLStage.ANALYZING,
			timezone.now()
		)
		self.save()

	def get_cleanup_task(self):
		task_name = "Cleanup %s" % self.staging_table
		return RedshiftETLTask(task_name, self.do_cleanup)

	def do_cleanup(self):
		if self.stage != RedshiftETLStage.CLEANING_UP:
			self.stage = RedshiftETLStage.CLEANING_UP
			self.cleaning_up_started_at = timezone.now()
			self.save()
			self.heartbeat_track_status_metrics()

		try:
			streams.delete_firehose_stream(self.firehose_stream)
		except Exception as e:
			error_handler(e)

		if not settings.REDSHIFT_ETL_KEEP_STAGING_TABLES:
			try:
				engine = redshift.get_redshift_engine(etl_user=True)
				conn = engine.connect()
				conn.execution_options(isolation_level="AUTOCOMMIT")
				conn.execute("DROP TABLE IF EXISTS %s;" % self.pre_insert_table_name)
				conn.execute("DROP TABLE IF EXISTS %s;" % self.staging_table)
			except Exception as e:
				error_handler(e)

		self.cleaning_up_ended_at = timezone.now()
		self.stage = RedshiftETLStage.FINISHED
		self.save()
		self.heartbeat_track_status_metrics()

	def reset_to_stage(self, stage):
		self.stage = stage

		if int(stage) < int(RedshiftETLStage.CLEANING_UP):
			self.cleaning_up_ended_at = None
			self.cleaning_up_started_at = None

		if int(stage) < int(RedshiftETLStage.ANALYZE_COMPLETE):
			self.analyzing_started_at = None
			self.analyzing_ended_at = None

		if int(stage) < int(RedshiftETLStage.VACUUM_COMPLETE):
			self.vacuuming_started_at = None
			self.vacuuming_ended_at = None

		if int(stage) < int(RedshiftETLStage.REFRESHING_MATERIALIZED_VIEWS_COMPLETE):
			self.refreshing_materialized_views_started_at = None
			self.refreshing_materialized_views_ended_at = None

		if int(stage) < int(RedshiftETLStage.INSERT_COMPLETE):
			self.inserting_started_at = None
			self.inserting_ended_at = None

		if int(stage) < int(RedshiftETLStage.DEDUPLICATION_COMPLETE):
			self.deduplicating_started_at = None
			self.deduplicating_ended_at = None

		if int(stage) < int(RedshiftETLStage.GATHERING_STATS_COMPLETE):
			self.gathering_stats_started_at = None
			self.gathering_stats_ended_at = None

		self.save()

	def _make_async_query_handle(self):
		return "handle-%s" % str(uuid4())[:7]

	def refresh_table_state(self):
		# If the table previously launched a long running operation
		# Check whether it finished here.
		if self.stage == RedshiftETLStage.ANALYZING:
			self._attempt_update_status_to_stage(
				RedshiftETLStage.ANALYZE_COMPLETE,
				"analyzing_ended_at",
				self.analyze_query_handle
			)

		if self.stage == RedshiftETLStage.VACUUMING:
			# Requires special handling
			self._attempt_update_vacuum_state()

		if self.stage == RedshiftETLStage.REFRESHING_MATERIALIZED_VIEWS:
			self._attempt_update_status_to_stage(
				RedshiftETLStage.REFRESHING_MATERIALIZED_VIEWS_COMPLETE,
				"refreshing_materialized_views_ended_at",
				self.refreshing_view_handle
			)

		if self.stage == RedshiftETLStage.INSERTING:
			self._attempt_update_status_to_stage(
				RedshiftETLStage.INSERT_COMPLETE,
				"inserting_ended_at",
				self.insert_query_handle
			)

		if self.stage == RedshiftETLStage.DEDUPLICATING:
			self._attempt_update_status_to_stage(
				RedshiftETLStage.DEDUPLICATION_COMPLETE,
				"deduplicating_ended_at",
				self.dedupe_query_handle
			)

		if self.stage == RedshiftETLStage.GATHERING_STATS:
			self._attempt_update_status_to_stage(
				RedshiftETLStage.GATHERING_STATS_COMPLETE,
				"gathering_stats_ended_at",
				self.gathering_stats_handle
			)

	def _attempt_update_status_to_stage(self, stage, field, handle, min_expected_count=1):
		# Use the handle to check the status of the query
		if redshift.has_inflight_queries(handle):
			# If we see there is still something actively in flight then we can exit early.
			return

		# The min_expected_count is the minimum number of statements that must exist
		# in the QLOG table to be complete.
		# It's possible that there could be more.
		is_complete, had_errors, num_stmts, finished_at = get_handle_status(
			handle,
			min_expected_count
		)

		if redshift.is_analyze_skipped(handle):
			finished_at = datetime.now()
			is_complete = True

		if is_complete:
			tz_aware_ending_timestamp = timezone.make_aware(finished_at)
			if had_errors:
				self.stage = RedshiftETLStage.ERROR
			else:
				self.stage = stage
			setattr(self, field, tz_aware_ending_timestamp)
			self.save()
			self.heartbeat_track_status_metrics()

	def _attempt_update_vacuum_state(self):
		template = """
			SELECT endtime
			FROM SVL_QLOG q
			JOIN stl_Vacuum v ON v.xid = q.xid
			WHERE q.label = '{handle}'
			AND status = 'Finished'
			ORDER BY endtime DESC
			LIMIT 1;
		"""

		sql = template.format(
			handle=self.vacuum_query_handle,
		)

		conn = redshift.get_new_redshift_connection(etl_user=True)
		rp1 = conn.execute(sql)

		rows = list(rp1)
		if len(rows) == 1:
			latest_end_date = rows[0][0]
			tz_aware_ending_timestamp = timezone.make_aware(latest_end_date)
			self.stage = RedshiftETLStage.VACUUM_COMPLETE
			self.vacuuming_ended_at = tz_aware_ending_timestamp
			self.save()
			self.heartbeat_track_status_metrics()

	def get_pct_unsorted(self):
		query = """
			SELECT pct_unsorted FROM pct_unsorted_rows WHERE table_name = '%s';
		""" % self.target_table
		return redshift.get_new_redshift_connection(etl_user=True).execute(query).scalar()

	def vacuum_is_needed(self):
		VACUUM_THRESHOLD = settings.REDSHIFT_PCT_UNSORTED_ROWS_TOLERANCE
		pct_unsorted = self.get_pct_unsorted()
		return pct_unsorted >= VACUUM_THRESHOLD

	def _get_table_obj(self):
		return get_redshift_metadata(refresh=True).tables[self.staging_table]

	def _get_target_table_obj(self):
		return get_redshift_metadata(refresh=True).tables[self.target_table]

	def _get_staging_table_size_stmt(self):
		return select([func.count()]).select_from(self._get_table_obj())

	def _get_final_staging_table_size(self):
		stmt = self._get_staging_table_size_stmt()
		compiled_statement = stmt.compile(
			bind=redshift.get_redshift_engine(etl_user=True)
		)

		rp = compiled_statement.execute()
		first_row = rp.first()
		return first_row[0]

	def record_final_staging_table_size(self):
		self.final_staging_table_size = self._get_final_staging_table_size()
		self.save()
		return self.final_staging_table_size

	def record_deduped_table_size(self):
		if self.final_staging_table_size:
			query = "select count(*) from %s;" % self.pre_insert_table_name
			self.deduped_table_size = redshift.get_new_redshift_connection(
				etl_user=True
			).execute(query).scalar()
		else:
			self.deduped_table_size = 0
		self.save()

	def record_pre_insert_prod_table_size(self):
		if self.target_eligible_for_prod_table_size_metric():
			query = "select count(*) from %s;" % self.target_table
			rp = redshift.get_new_redshift_connection(etl_user=True).execute(query)
			self.pre_insert_table_size = rp.scalar()
			self.save()

	def record_post_insert_prod_table_size(self):
		if self.target_eligible_for_prod_table_size_metric():
			query = "select count(*) from %s;" % self.target_table
			rp = redshift.get_new_redshift_connection(etl_user=True).execute(query)
			self.post_insert_table_size = rp.scalar()
			self.save()

	def target_eligible_for_prod_table_size_metric(self):
		eligible_tables = (
			"game",
		)
		return self.target_table in eligible_tables

	def _get_min_max_game_dates_stmt(self):
		tbl = self._get_table_obj()
		cols = [func.min(tbl.c.game_date), func.max(tbl.c.game_date)]
		return select(cols).select_from(tbl)

	def get_min_max_game_dates_from_staging_table(self):
		stmt = self._get_min_max_game_dates_stmt()
		compiled_statement = stmt.compile(
			bind=redshift.get_redshift_engine(etl_user=True)
		)

		rp = compiled_statement.execute()
		first_row = rp.first()
		if first_row:
			self.min_game_date = first_row[0]
			self.max_game_date = first_row[1]
			self.save()
			return self.min_game_date, self.max_game_date
		else:
			raise RuntimeError("Could not get min and max game_date from staging table")

	def capture_track_finished_metrics(self):
		if self.stage != RedshiftETLStage.FINISHED:
			raise RuntimeError("Cannot call on unfinished tracks.")

		self.capture_stage_duration(
			RedshiftETLStage.GATHERING_STATS,
			self.gathering_stats_started_at,
			self.gathering_stats_ended_at
		)

		self.capture_stage_duration(
			RedshiftETLStage.DEDUPLICATING,
			self.deduplicating_started_at,
			self.deduplicating_ended_at
		)

		self.capture_stage_duration(
			RedshiftETLStage.INSERTING,
			self.inserting_started_at,
			self.inserting_ended_at
		)

		self.capture_stage_duration(
			RedshiftETLStage.REFRESHING_MATERIALIZED_VIEWS,
			self.refreshing_materialized_views_started_at,
			self.refreshing_materialized_views_ended_at
		)

		self.capture_stage_duration(
			RedshiftETLStage.VACUUMING,
			self.vacuuming_started_at,
			self.vacuuming_ended_at,
		)

		self.capture_stage_duration(
			RedshiftETLStage.ANALYZING,
			self.analyzing_started_at,
			self.analyzing_ended_at
		)

		self.capture_stage_duration(
			RedshiftETLStage.CLEANING_UP,
			self.cleaning_up_started_at,
			self.cleaning_up_ended_at
		)

		self.capture_record_count_metrics()

	def capture_stage_duration(self, stage, start, end, extra_fields=None):
		if start and end:
			duration = int((end - start).total_seconds())
			fields = {
				"seconds": duration,
				"track_id": self.track_id,
				"id": self.id
			}
			if extra_fields:
				fields.update(extra_fields)
			influx_metric(
				"redshift_etl_track_table_stage_duration_seconds",
				fields,
				target_table=self.target_table,
				stage=stage.name.lower(),
			)

	def heartbeat_track_status_metrics(self):
		if self.stage <= RedshiftETLStage.ACTIVE:
			raise RuntimeError("Status metrics should only be for the processing track")

		heartbeat_stages = [
			RedshiftETLStage.GATHERING_STATS,
			RedshiftETLStage.DEDUPLICATING,
			RedshiftETLStage.INSERTING,
			RedshiftETLStage.REFRESHING_MATERIALIZED_VIEWS,
			RedshiftETLStage.VACUUMING,
			RedshiftETLStage.ANALYZING,
			RedshiftETLStage.CLEANING_UP
		]

		for s in heartbeat_stages:
			self.heartbeat_track_status_metrics_for_stage(s)

	def heartbeat_track_status_metrics_for_stage(self, stage, ts=None):
		stage_start = self.get_stage_started_at(stage)
		stage_end = self.get_stage_ended_at(stage)

		stage_start_val = stage_start.isoformat()[:19] if stage_start else " "
		stage_end_val = stage_end.isoformat()[:19] if stage_end else " "

		if stage_start and stage_end:
			duration = float((stage_end - stage_start).total_seconds())
		elif stage_start:
			duration = float((timezone.now() - stage_start).total_seconds())
		else:
			duration = float(0)

		stage_id = int(stage.value)
		fields = {
			"stage_start": stage_start_val,
			"stage_end": stage_end_val,
			"duration": duration,
			"track_id": self.track_id,
			"id": self.id,
			"stage_id": stage_id
		}
		influx_metric(
			"redshift_etl_track_table_status",
			fields,
			target_table=self.target_table,
			stage=stage.name.lower(),
		)

	def capture_record_count_metrics(self):
		if not self.is_materialized_view:

			have_pre_insert_size = self.pre_insert_table_size is not None
			have_post_insert_size = self.post_insert_table_size is not None
			if have_post_insert_size and have_pre_insert_size:
				new_record_count = self.post_insert_table_size - self.pre_insert_table_size
			else:
				new_record_count = None

			if self.final_staging_table_size is not None and self.deduped_table_size is not None:
				previous_track_dupes = self.final_staging_table_size - self.deduped_table_size
			else:
				previous_track_dupes = None

			if new_record_count is not None:
				inter_track_dupes = self.deduped_table_size - new_record_count
			else:
				inter_track_dupes = None

			fields = {
				"staged_record_count": self.final_staging_table_size,
				"deduped_record_count": self.deduped_table_size,
				"pre_insert_record_count": self.pre_insert_table_size,
				"post_insert_record_count": self.post_insert_table_size,
				"new_record_count": new_record_count,
				"previous_track_dupes_removed": previous_track_dupes,
				"inter_track_dupes_removed": inter_track_dupes,
				"track_id": self.track_id,
				"id": self.id
			}
			influx_metric(
				"redshift_etl_track_table_record_counts",
				fields,
				target_table=self.target_table,
			)

	def set_stage_started_at(self, stage, val):
		if stage <= RedshiftETLStage.ACTIVE or stage == RedshiftETLStage.FINISHED:
			raise RuntimeError("Method not eligible for stage: %s" % (stage.name.lower(),))

		field_name = "%s_started_at" % stage.name.lower()
		setattr(self, field_name, val)

	def get_stage_started_at(self, stage):
		if stage <= RedshiftETLStage.ACTIVE or stage == RedshiftETLStage.FINISHED:
			raise RuntimeError("Method not eligible for stage: %s" % (stage.name.lower(),))

		field_name = "%s_started_at" % stage.name.lower()
		return getattr(self, field_name, None)

	def set_stage_ended_at(self, stage, val):
		if stage <= RedshiftETLStage.ACTIVE or stage == RedshiftETLStage.FINISHED:
			raise RuntimeError("Method not eligible for stage: %s" % (stage.name.lower(),))

		field_name = "%s_ended_at" % stage.name.lower()
		setattr(self, field_name, val)

	def get_stage_ended_at(self, stage):
		if stage <= RedshiftETLStage.ACTIVE or stage == RedshiftETLStage.FINISHED:
			raise RuntimeError("Method not eligible for stage: %s" % (stage.name.lower(),))

		field_name = "%s_ended_at" % stage.name.lower()
		return getattr(self, field_name, None)
