import logging
import time
from math import ceil

from django.conf import settings

from .clients import FIREHOSE, IAM, KINESIS


logger = logging.getLogger("hsreplaynet")

KINESIS_WRITES_PER_SEC = 1000
KINESIS_MAX_BATCH_WRITE_SIZE = 500
MAX_WRITES_SAFETY_LIMIT = .8


def get_firehose_role_arn() -> str:
	role = IAM.get_role(
		RoleName="redshift_firehose_role"
	)
	return role["Role"]["Arn"]


def list_delivery_streams():
	result = []
	finished = False
	start_stream_name = None
	while not finished:
		if start_stream_name:
			response = FIREHOSE.list_delivery_streams(
				ExclusiveStartDeliveryStreamName=start_stream_name
			)
		else:
			response = FIREHOSE.list_delivery_streams()
		result.extend(response["DeliveryStreamNames"])
		start_stream_name = response["DeliveryStreamNames"][-1]
		finished = not response["HasMoreDeliveryStreams"]
	return result


def does_stream_exist(stream_name) -> bool:
	return stream_name in list_delivery_streams()


def create_firehose_stream(stream_name, table_name):
	configuration = settings.REDSHIFT_FIREHOSE_TEMPLATE.copy()
	configuration["CopyCommand"]["DataTableName"] = table_name

	return FIREHOSE.create_delivery_stream(
		DeliveryStreamName=stream_name,
		RedshiftDestinationConfiguration=configuration
	)


def wait_for_stream_ready(stream_name, max_attempts=15):
	for i in range(max_attempts):
		stream_info = KINESIS.describe_stream(StreamName=stream_name)
		stream_status = stream_info["StreamDescription"]["StreamStatus"]
		if stream_status == "ACTIVE":
			return
		time.sleep(4)

	raise RuntimeError(f"Timed out while waiting for {stream_name} to become active.")


def list_shards(stream_name: str):
	shard_info = KINESIS.list_shards(StreamName=stream_name)
	shards = shard_info["Shards"]

	while "NextToken" in shard_info:
		shard_info = KINESIS.list_shards(NextToken=shard_info["NextToken"])
		shards.extend(shard_info["Shards"])

	return shards


def list_open_shards(stream_name: str):
	for shard in list_shards(stream_name):
		if "EndingSequenceNumber" not in shard["SequenceNumberRange"]:
			yield shard


def current_stream_size(stream_name: str) -> int:
	return len(list(list_open_shards(stream_name)))


def next_record_batch_of_size(iterable, max_batch_size: int):
	result = []
	count = 0
	record = next(iterable, None)
	while record and count < max_batch_size:
		result.append(record)
		count += 1
		record = next(iterable, None)
	return result


def publish_from_iterable_at_fixed_speed(
	iterable,
	publisher_func,
	max_records_per_second,
	publish_batch_size=1
):
	if max_records_per_second == 0:
		raise ValueError("times_per_second must be greater than 0!")

	finished = False
	while not finished:
		try:
			start_time = time.time()
			records_this_second = 0
			while not finished and records_this_second < max_records_per_second:
				# NOTE: If the aggregate data published exceeds 1MB / second there will
				# be write throughput failures.
				# As Of 9-20-16 the average record was ~ 180 Bytes
				# 180 Bytes * 1000 = 180KB (which is well below the threshold)
				batch = next_record_batch_of_size(iterable, publish_batch_size)
				if batch:
					records_this_second += len(batch)
					publisher_func(batch)
				else:
					finished = True

			if not finished:
				elapsed_time = time.time() - start_time
				sleep_duration = 1 - elapsed_time
				if sleep_duration > 0:
					time.sleep(sleep_duration)
		except StopIteration:
			finished = True


def fill_stream_from_iterable(stream_name, iterable, publisher_func):
	"""
	Invoke func on the next item from iter at the maximum throughput the stream supports.
	"""

	wait_for_stream_ready(stream_name)
	stream_size = current_stream_size(stream_name)
	max_transactions_per_sec = stream_size * KINESIS_WRITES_PER_SEC
	target_writes_per_sec = ceil(max_transactions_per_sec * MAX_WRITES_SAFETY_LIMIT)
	logger.info(
		"About to fill stream %s at a target of %s writes per second",
		stream_name, target_writes_per_sec
	)

	publish_from_iterable_at_fixed_speed(
		iterable, publisher_func, target_writes_per_sec,
		publish_batch_size=KINESIS_MAX_BATCH_WRITE_SIZE
	)


def to_data_blobs(records, max_blob_size=1000):
	result = []
	current_blob_size = 0
	current_blob_components = []

	for rec in records:
		rec_data = rec
		if current_blob_size + len(rec_data) >= max_blob_size:
			result.append({
				"Data": "".join(current_blob_components).encode("utf-8")
			})
			current_blob_size = 0
			current_blob_components = []

		current_blob_components.append(rec_data)
		current_blob_size += len(rec_data)

	if current_blob_size > 0:
		# At the end flush the remaining blob if its > 0
		result.append({
			"Data": "".join(current_blob_components).encode("utf-8")
		})

	return result


def publish_batch_to_firehose(stream_name, batch):
	remainder = batch
	failure_report_records = None
	attempt_count = 0
	while len(remainder) and attempt_count <= 3:
		remainder, failure_report_records = _attempt_publish_batch_to_firehose(
			stream_name,
			remainder
		)
		if len(remainder):
			msg = "Firehose attempt %i had %i publish failures"
			logger.warning(msg % (attempt_count, len(remainder)))

	if len(failure_report_records):
		msg = "Firehose had %i publish failures remaining after last attempt"
		logger.warning(msg % len(failure_report_records))


def _attempt_publish_batch_to_firehose(stream_name, batch):
	result = FIREHOSE.put_record_batch(
		DeliveryStreamName=stream_name,
		Records=batch
	)

	failed_put_count = result["FailedPutCount"]

	failure_report_records = []
	failed_records = []
	for record, result in zip(batch, result["RequestResponses"]):
		if "ErrorCode" in result:
			failure_report_records.append(dict(
				record=record,
				stream_name=stream_name,
				error_code=result["ErrorCode"],
				error_message=result["ErrorMessage"]
			))
			failed_records.append(record)

	assert failed_put_count == len(failed_records)
	return failed_records, failure_report_records
