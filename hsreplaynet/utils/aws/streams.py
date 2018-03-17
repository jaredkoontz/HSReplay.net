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
	return FIREHOSE.create_delivery_stream(
		DeliveryStreamName=stream_name,
		RedshiftDestinationConfiguration={
			"RoleARN": get_firehose_role_arn(),
			"ClusterJDBCURL": settings.REDSHIFT_DATABASE["JDBC_URL"],
			"CopyCommand": {
				"DataTableName": table_name,
				"CopyOptions": "GZIP COMPUPDATE OFF STATUPDATE OFF"
			},
			"Username": settings.REDSHIFT_DATABASE["USER"],
			"Password": settings.REDSHIFT_DATABASE["PASSWORD"],
			"S3Configuration": {
				"RoleARN": get_firehose_role_arn(),
				"BucketARN": "arn:aws:s3:::%s" % (settings.REDSHIFT_STAGING_BUCKET),
				"BufferingHints": {
					"SizeInMBs": settings.REDSHIFT_STAGING_BUFFER_SIZE_MB,
					"IntervalInSeconds": settings.REDSHIFT_STAGING_BUFFER_INTERVAL_SECONDS
				},
				"CompressionFormat": "GZIP"
			}
		}
	)


def wait_for_stream_ready(stream_name, max_attempts=15):
	for i in range(max_attempts):
		stream_info = KINESIS.describe_stream(StreamName=stream_name)
		stream_status = stream_info["StreamDescription"]["StreamStatus"]
		if stream_status == "ACTIVE":
			return
		time.sleep(4)

	raise RuntimeError(f"Timed out while waiting for {stream_name} to become active.")


def generate_shard_list(stream_name):
	wait_for_stream_ready(stream_name)
	sinfo = KINESIS.describe_stream(StreamName=stream_name)
	shards = sinfo["StreamDescription"]["Shards"]

	while len(shards) > 0:
		shard = shards.pop(0)
		yield shard
		if len(shards) == 0 and sinfo["StreamDescription"]["HasMoreShards"]:
			sinfo = KINESIS.describe_stream(
				StreamName=stream_name,
				ExclusiveStartShardId=shard["ShardId"]
			)
			shards += sinfo["StreamDescription"]["Shards"]


def shard_is_open(s) -> bool:
	return "EndingSequenceNumber" not in s["SequenceNumberRange"]


def get_open_shards(stream_name: str):
	shards = generate_shard_list(stream_name)
	open_shards = list(filter(shard_is_open, shards))
	return open_shards


def current_stream_size(stream_name: str) -> int:
	return len(get_open_shards(stream_name))


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
