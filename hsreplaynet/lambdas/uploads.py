import json
import logging
from datetime import datetime
from io import BytesIO
from threading import Thread
from zlib import decompress

from django.conf import settings
from django.core.exceptions import ValidationError
from hsreplay.document import HSReplayDocument

from hearthsim.identity.accounts.models import AuthToken
from hearthsim.identity.api.models import APIKey as LegacyAPIKey
from hsredshift.etl.exporters import RedshiftPublishingExporter
from hsredshift.etl.firehose import flush_exporter_to_firehose
from hsreplaynet.uploads.models import (
	RawUpload, UploadEvent, UploadEventStatus, _generate_upload_key
)
from hsreplaynet.utils import instrumentation
from hsreplaynet.utils.aws.clients import LAMBDA, S3
from hsreplaynet.utils.influx import influx_metric
from hsreplaynet.utils.synchronization import CountDownLatch


@instrumentation.lambda_handler(
	cpu_seconds=180,
	requires_vpc_access=True,
	memory=settings.LAMBDA_PROCESSING_MEMORY_MB,
	stream_name=settings.KINESIS_UPLOAD_PROCESSING_STREAM_NAME,
	stream_batch_size=getattr(settings, "LAMBDA_STREAM_BATCH_SIZE", 50),
)
def process_replay_upload_stream_handler(event, context):
	"""
	A handler that supports reading from a stream with batch size > 1.

	If this handler is invoked with N records in the event, then it will invoke the
	single record processing lambda N times in parallel and exit once they have
	all returned.

	In combination with the number of shards in the stream, this allows for tuning the
	parallelism of processing a stream more dynamically. The parallelism of the stream
	is governed by:

	CONCURRENT_LAMBDAS = NUM_SHARDS * STREAM_BATCH_SIZE

	This also provides for controllable concurrency of lambdas much more cost efficiently
	as we can run with many fewer shards, and we only pay the tax of this additional
	lambda invocation. For example, with stream_batch_size = 2, this costs 50% as much
	as adding a second shard would cost. With stream_batch_size = 8, this costs 7% as
	much as adding 7 additional shards would cost.

	When using this lambda, the number of shards should be set to be the fewest number
	required to achieve the required write throughput. Then the batch size of this lambda
	should be tuned to achieve the final desired concurrency level.
	"""
	logger = logging.getLogger("hsreplaynet.lambdas.process_replay_upload_stream_handler")
	records = event["Records"]
	num_records = len(records)
	logger.debug("Kinesis batch handler invoked with %s records", num_records)

	countdown_latch = CountDownLatch(num_records)

	def lambda_invoker(payload, shortid):
		try:
			logger.debug("About to invoke single lambda for %s", shortid)
			LAMBDA.invoke(
				FunctionName="process_single_replay_upload_stream_handler",
				InvocationType="RequestResponse",  # Triggers synchronous invocation
				Payload=payload,
			)
		finally:
			logger.debug("Lambda completed for %s Decrementing latch.", shortid)
			countdown_latch.count_down()

	for record in records:
		shortid = record["kinesis"]["partitionKey"]
		payload = json.dumps({"Records": [record]})
		logger.debug("Invoking Lambda for %s", shortid)
		lambda_invocation = Thread(target=lambda_invoker, args=(payload, shortid))
		lambda_invocation.start()

	logger.debug("All child invocations have been started")
	# We will exit once all child invocations have returned.
	countdown_latch.await_()
	logger.debug("All child invocations have completed")


@instrumentation.lambda_handler(
	cpu_seconds=180,
	requires_vpc_access=True,
	memory=settings.LAMBDA_PROCESSING_MEMORY_MB,
)
def process_single_replay_upload_stream_handler(event, context):
	"""
	A handler that consumes single records from an AWS Kinesis stream.
	"""
	logger = logging.getLogger(
		"hsreplaynet.lambdas.process_single_replay_upload_stream_handler"
	)
	log_group_name = context.log_group_name
	log_stream_name = context.log_stream_name

	kinesis_event = event["Records"][0]["kinesis"]
	raw_upload = RawUpload.from_kinesis_event(kinesis_event)

	# Reprocessing will only be True when the UploadEvent was scheduled via the Admin
	reprocessing = raw_upload.attempt_reprocessing

	logger.info(
		"Kinesis RawUpload: %r (reprocessing=%r)", raw_upload, reprocessing
	)
	process_raw_upload(raw_upload, reprocessing, log_group_name, log_stream_name)


@instrumentation.lambda_handler(
	cpu_seconds=180,
	name="ProcessS3CreateObjectV1",
	requires_vpc_access=True,
	memory=settings.LAMBDA_PROCESSING_MEMORY_MB,
)
def process_s3_create_handler(event, context):
	"""
	A handler that is triggered whenever a "..power.log" suffixed object is created in S3.
	"""
	logger = logging.getLogger("hsreplaynet.lambdas.process_s3_create_handler")
	log_group_name = context.log_group_name
	log_stream_name = context.log_stream_name

	s3_event = event["Records"][0]["s3"]
	raw_upload = RawUpload.from_s3_event(s3_event)

	# This handler entry point should only fire for new raw log uploads
	reprocessing = False

	logger.info(
		"S3 RawUpload: %r (reprocessing=%r)", raw_upload, reprocessing
	)
	process_raw_upload(raw_upload, reprocessing, log_group_name, log_stream_name)


def auth_token_from_header(header: str):
	header = header.lower()

	method, _, token = header.partition(" ")
	if method != "token":
		return

	try:
		return AuthToken.objects.get(key=token)
	except (AuthToken.DoesNotExist, ValueError):
		pass


def process_raw_upload(raw_upload, reprocess=False, log_group_name="", log_stream_name=""):
	"""
	Generic processing logic for raw log files.
	"""
	from ..games.serializers import UploadEventSerializer

	logger = logging.getLogger("hsreplaynet.lambdas.process_raw_upload")

	obj, created = UploadEvent.objects.get_or_create(
		shortid=raw_upload.shortid,
		defaults={"status": UploadEventStatus.PENDING}
	)

	logger.debug("UploadEvent Created: %r", created)
	if not created and not reprocess:
		# This can occur two ways:
		# 1) The client sends the PUT request twice
		# 2) Re-enabling processing queues an upload to the stream and the S3 event fires
		logger.info("Invocation is an instance of double_put. Exiting Early.")
		influx_metric("raw_log_double_put", {
			"count": 1,
			"shortid": raw_upload.shortid,
			"key": raw_upload.log_key
		})

		return

	obj.log_group_name = log_group_name
	obj.log_stream_name = log_stream_name

	descriptor = raw_upload.descriptor
	new_log_key = _generate_upload_key(raw_upload.timestamp, raw_upload.shortid)
	new_bucket = settings.AWS_STORAGE_BUCKET_NAME

	# Move power.log to the other bucket if it's needed
	raw_upload.prepare_upload_event_log_location(new_bucket, new_log_key)

	upload_metadata = descriptor["upload_metadata"]
	event = descriptor["event"]
	headers = {k.lower(): v for k, v in event.get("headers", {}).items()}
	user_agent = headers.get("user-agent", "")
	logger.debug("User Agent: %r", user_agent)

	obj.file = new_log_key
	obj.descriptor_data = raw_upload.descriptor_json
	obj.upload_ip = event.get("requestContext", {}).get("identity", {}).get("sourceIp", "")
	obj.canary = "canary" in upload_metadata and upload_metadata["canary"]
	obj.user_agent = user_agent[:100]
	obj.status = UploadEventStatus.VALIDATING

	try:
		if not obj.user_agent:
			raise ValidationError("Missing User-Agent header")
		header = headers.get("authorization", "")
		token = auth_token_from_header(header)
		if not token:
			msg = "Malformed or Invalid Authorization Header: %r" % (header)
			logger.error(msg)
			raise ValidationError(msg)
		obj.token_uuid = token.key

		if token.test_data:
			obj.test_data = True

		api_key = headers.get("x-api-key", "")
		if not api_key:
			raise ValidationError("Missing X-Api-Key header. Please contact us for an API key.")
		obj.api_key_id = LegacyAPIKey.objects.get(api_key=api_key).id

		# This is a first-level attempt to identify files (such as the ones uploaded as part of
		# https://github.com/HearthSim/HSReplay.net/issues/812) that can't be properly decoded
		# to a stream of bytes because they're invalid at some lower level of binary
		# encoding - e.g., incorrectly compressed In this case we should mark them invalid
		# immediately.

		try:
			with obj.file.open(mode="rb") as log_file:
				while log_file.read(4096):
					pass
		except OSError as e:
			raise ValidationError("Could not read uploaded log: {0}".format(e))

	except (ValidationError, LegacyAPIKey.DoesNotExist) as e:
		logger.error("Exception: %r", e)
		obj.status = UploadEventStatus.VALIDATION_ERROR
		obj.error = e
		obj.save()
		logger.info("All state successfully saved to UploadEvent with id: %r", obj.id)

		# If we get here, now everything is in the DB.
		# Clear out the raw upload so it doesn't clog up the pipeline.
		raw_upload.delete()
		logger.info("Deleting objects from S3 succeeded.")
		logger.info("Validation Error will be raised and we will not proceed to processing")
		raise
	else:
		if "test_data" in upload_metadata:
			obj.test_data = True

		# Only old clients released during beta do not include a user agent
		is_unsupported_client = obj.user_agent.startswith(settings.UPLOAD_USER_AGENT_BLACKLIST)

		if is_unsupported_client:
			logger.info("No UA provided. Marking as unsupported (client too old).")
			influx_metric("upload_from_unsupported_client", {
				"count": 1,
				"shortid": raw_upload.shortid,
			})
			obj.status = UploadEventStatus.UNSUPPORTED_CLIENT

		obj.save()
		logger.debug("Saved: UploadEvent.id = %r", obj.id)

		# If we get here, now everything is in the DB.
		raw_upload.delete()
		logger.debug("Deleting objects from S3 succeeded")

		if is_unsupported_client:
			# Wait until after we have deleted the raw_upload to exit
			# But do not start processing if it's an unsupported client
			logger.info("Exiting Without Processing - Unsupported Client")
			return

	serializer = UploadEventSerializer(obj, data=upload_metadata)
	if serializer.is_valid():
		logger.debug("UploadEvent passed serializer validation")
		obj.status = UploadEventStatus.PROCESSING
		serializer.save()

		logger.debug("Starting GameReplay processing for UploadEvent")
		obj.process()
	else:
		obj.error = serializer.errors
		logger.info("UploadEvent failed validation with errors: %r", obj.error)

		obj.status = UploadEventStatus.VALIDATION_ERROR
		obj.save()

	logger.debug("Done")


@instrumentation.lambda_handler(
	cpu_seconds=120,
	memory=settings.LAMBDA_PROCESSING_MEMORY_MB
)
def load_replay_into_redshift(event, context):
	"""A handler that loads a replay into Redshift"""
	logger = logging.getLogger("hsreplaynet.lambdas.load_replay_into_redshift")
	replay_bucket = event["replay_bucket"]
	replay_key = event["replay_key"]
	metadata_str = event["metadata"]

	obj = S3.get_object(Bucket=replay_bucket, Key=replay_key)
	body_data = obj["Body"].read()
	log_str = decompress(body_data, 15 + 32)
	out = BytesIO()
	out.write(log_str)
	out.seek(0)

	try:
		replay = HSReplayDocument.from_xml_file(out)
		metadata = json.loads(metadata_str)

		global_game_id = metadata["game_id"]
		from hsreplaynet.games.models import GlobalGame

		global_game = GlobalGame.objects.get(id=global_game_id)

		packet_tree = replay.to_packet_tree()[0]
		exporter = RedshiftPublishingExporter(packet_tree).export()
		exporter.set_game_info(metadata)
		flush_exporter_to_firehose(exporter)
	except Exception:
		logger.info(metadata_str)
		raise
	else:
		global_game.loaded_into_redshift = datetime.now()
		global_game.save()
