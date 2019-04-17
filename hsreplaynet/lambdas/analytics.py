import json
import logging
import time
from threading import Thread
from urllib.parse import unquote

from django.conf import settings
from raven.contrib.django.raven_compat.models import client as sentry
from redis_semaphore import NotAvailable

from hsreplaynet.analytics.processing import (
	_do_execute_query, get_concurrent_redshift_query_queue_semaphore, refresh_meta_preview
)
from hsreplaynet.settings import REDSHIFT_PREEMPTIVELY_REFRESH_QUERIES
from hsreplaynet.utils import instrumentation
from hsreplaynet.utils.aws.clients import SQS
from hsreplaynet.utils.aws.redshift import get_redshift_catalogue, get_redshift_query
from hsreplaynet.utils.aws.sqs import get_messages, get_or_create_queue
from hsreplaynet.utils.influx import influx_metric
from hsreplaynet.utils.synchronization import CountDownLatch


@instrumentation.lambda_handler(
	cpu_seconds=300,
	requires_vpc_access=True,
	memory=512,
)
def refresh_stale_redshift_queries(event, context):
	"""A cron'd handler that attempts to refresh queries queued in Redis"""
	logger = logging.getLogger("hsreplaynet.lambdas.refresh_stale_redshift_queries")
	start_time = time.time()
	logger.info("Start Time: %s" % str(start_time))
	catalogue = get_redshift_catalogue()
	scheduler = catalogue.scheduler
	target_duration_seconds = 55
	duration = 0

	for queue_name in scheduler.query_queues:
		influx_metric(
			"redshift_refresh_queue_depth",
			{"depth": scheduler.queue_size(queue_name)},
			queue_name=queue_name,
		)

	# We run for 55 seconds, since the majority of queries take < 5 seconds to finish
	# And the next scheduled invocation of this will be starting a minute after this one.
	while duration < target_duration_seconds:
		logger.info("Runtime duration: %s" % str(duration))

		available_slots = scheduler.get_available_slots() - scheduler.get_queued_query_count()
		logger.info("Available cluster slots: %s" % str(available_slots))

		if available_slots <= 1:
			sleep_duration = 5
			logger.info("Sleeping for %i until more slots are available" % sleep_duration)
			# If only 1 slot remains leave it for ETL or an IMMEDIATE query.
			time.sleep(sleep_duration)
			current_time = time.time()
			duration = current_time - start_time
			continue

		remaining_seconds = target_duration_seconds - duration
		if remaining_seconds < 1:
			break

		logger.info("Will block for queued query for %s seconds" % str(remaining_seconds))
		try:
			refreshed_query = scheduler.refresh_next_pending_query(
				block_for=remaining_seconds,
				# This uses available cluster resources to refresh queries early
				force=REDSHIFT_PREEMPTIVELY_REFRESH_QUERIES
			)
			if refreshed_query:
				logger.info("Refreshed: %s" % refreshed_query.cache_key)
			else:
				logger.info("Nothing to refresh.")
		except Exception:
			logger.error("Error refreshing query")
			sentry.captureException()

		current_time = time.time()
		duration = current_time - start_time


@instrumentation.lambda_handler(
	cpu_seconds=900,
	memory=3008,
	tracing=False,
	requires_vpc_access=True,
)
def finish_async_redshift_query(event, context):
	"""A handler triggered by the arrival of an UNLOAD manifest on S3

	The S3 trigger must be configured manually with:
		prefix = PROD
		suffix = manifest
	"""
	logger = logging.getLogger("hsreplaynet.lambdas.finish_async_redshift_query")
	catalogue = get_redshift_catalogue()

	s3_event = event["Records"][0]["s3"]
	bucket = s3_event["bucket"]["name"]
	manifest_key = unquote(s3_event["object"]["key"])

	if bucket == settings.S3_UNLOAD_BUCKET:
		logger.info("Finishing query: %s" % manifest_key)

		start_time = time.time()
		parameterized_query = catalogue.refresh_cache_from_s3_manifest_key(
			manifest_key=manifest_key
		)

		query_execute_metric_fields = {
			"duration_seconds": parameterized_query.most_recent_duration,
			"unload_seconds": time.time() - start_time,
			"query_handle": parameterized_query.most_recent_query_handle
		}
		query_execute_metric_fields.update(
			parameterized_query.supplied_non_filters_dict
		)

		influx_metric(
			"finished_async_redshift_query",
			query_execute_metric_fields,
			query_name=parameterized_query.query_name,
			**parameterized_query.supplied_filters_dict
		)


@instrumentation.lambda_handler(
	cpu_seconds=300,
	requires_vpc_access=True,
	memory=1536,
)
def execute_redshift_query(event, context):
	"""A handler that executes Redshift queries for the webserver"""
	query_name = event["query_name"]
	supplied_params = event["supplied_parameters"]
	queue_name = settings.REDSHIFT_ANALYTICS_QUERY_QUEUE_NAME
	do_execute_redshift_query(query_name, supplied_params, queue_name)


@instrumentation.lambda_handler(
	cpu_seconds=300,
	requires_vpc_access=True,
	memory=1536,
)
def drain_redshift_query_queue(event, context):
	"""A cron'd handler that attempts to drain any queued query requests in SQS."""
	queue_name = settings.REDSHIFT_ANALYTICS_QUERY_QUEUE_NAME
	drain_provided_redshift_query_queue(queue_name)


@instrumentation.lambda_handler(
	cpu_seconds=300,
	requires_vpc_access=True,
	memory=1536,
)
def drain_redshift_personalized_query_queue(event, context):
	"""A cron'd handler that attempts to drain any queued query requests in SQS."""
	queue_name = settings.REDSHIFT_PERSONALIZED_QUERY_QUEUE_NAME
	drain_provided_redshift_query_queue(queue_name)


def drain_provided_redshift_query_queue(queue_name):
	logger = logging.getLogger("hsreplaynet.lambdas.drain_redshift_query_queue")
	start_time = time.time()
	duration = 0
	zero_work_cycles = 0
	# We run for 55 seconds, since the majority of queries take < 5 seconds to finish
	# And the next scheduled invocation of this will be starting a minute after this one.
	while duration < 55:
		did_work = do_drain_redshift_query_queue_iteration(queue_name)
		if not did_work:
			zero_work_cycles += 1
			time.sleep(5)
		else:
			# Reset counter if we did any work
			zero_work_cycles = 0

		if zero_work_cycles >= 3:
			# If we go 3 cycles with no work to do then exit early to save resources
			logger.info("Went %i cycles with no work. Exiting." % zero_work_cycles)
			break

		current_time = time.time()
		duration = current_time - start_time


def do_drain_redshift_query_queue_iteration(queue_name):
	logger = logging.getLogger("hsreplaynet.lambdas.drain_redshift_query_queue")
	logger.info("Queue name: %s" % queue_name)

	semaphore = get_concurrent_redshift_query_queue_semaphore(queue_name)
	available_slots = semaphore.available_count
	logger.info("There are %i available slots" % available_slots)

	# We don't bother to pull more messages than open slots for running queries
	if available_slots:
		messages = get_messages(queue_name, available_slots)

		if messages:
			countdown_latch = CountDownLatch(len(messages))

			def redshift_query_runner(message):
				query_name = None
				try:
					receipt = message["ReceiptHandle"]
					body = json.loads(message["Body"])
					query_name = body["query_name"]
					params = body["supplied_parameters"]

					success = do_execute_redshift_query(query_name, params, queue_name)
					logger.info("Do Execute Result: %s" % str(success))

					if success:
						# If we don't delete the message then it will be retried in a subsequent lambda
						SQS.delete_message(
							QueueUrl=get_or_create_queue(queue_name),
							ReceiptHandle=receipt
						)

				finally:
					logger.debug("Lambda completed for %s Decrementing latch.", str(query_name))
					countdown_latch.count_down()

			for message in messages:
				lambda_invocation = Thread(target=redshift_query_runner, args=(message,))
				lambda_invocation.start()

			# We will exit once all child redshift_query_runners have returned.
			countdown_latch.await_()
			return True
		else:
			return False
	else:
		return False


def do_execute_redshift_query(query_name, supplied_params, queue_name):
	"""A common entry point for the actual execution of queries on Lambda"""
	logger = logging.getLogger("hsreplaynet.lambdas.execute_redshift_query")

	logger.info("Query Name: %s" % query_name)
	logger.info("Query Params: %s" % supplied_params)

	query = get_redshift_query(query_name)
	if not query:
		return False

	parameterized_query = query.build_full_params(supplied_params)

	try:
		wlm_queue = settings.REDSHIFT_QUERY_QUEUES[queue_name]["wlm_queue"]
		with get_concurrent_redshift_query_queue_semaphore(queue_name):
			_do_execute_query(parameterized_query, wlm_queue)
			logger.info("Query Execution Complete")
			return True
	except NotAvailable:
		logger.warn("The Redshift query queue was already at max concurrency. Skipping query.")

		metric_fields = {
			"count": 1
		}
		metric_fields.update(parameterized_query.supplied_non_filters_dict)
		influx_metric(
			"redshift_query_lambda_execution_concurrency_exceeded",
			metric_fields,
			query_name=query_name,
			**parameterized_query.supplied_filters_dict
		)
		return False


@instrumentation.lambda_handler(
	cpu_seconds=15,
	requires_vpc_access=True,
	memory=512,
)
def do_refresh_meta_preview(event, context):
	refresh_meta_preview()
