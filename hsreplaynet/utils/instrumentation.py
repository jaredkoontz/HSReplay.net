from functools import wraps

from django.conf import settings
from django.utils.timezone import now
from raven.contrib.django.raven_compat.models import client as sentry

from . import log
from .influx import influx_timer


def error_handler(e):
	log.exception(e)
	if not settings.ENV_DEV:
		sentry.captureException()


def get_shortid(event) -> str:
	"""
	Returns the Authorization token as a unique identifier.
	Used in the Lambda logging system to trace sessions.
	"""
	if "Records" not in event:
		return ""

	event_data = event["Records"][0]

	if "s3" in event_data:
		from hsreplaynet.uploads.models import RawUpload
		s3_event = event_data["s3"]
		raw_upload = RawUpload.from_s3_event(s3_event)
		return raw_upload.shortid

	elif "kinesis" in event_data:
		kinesis_event = event_data["kinesis"]
		# We always use the shortid as the partitionKey in kinesis streams
		return kinesis_event["partitionKey"]

	return ""


_lambda_descriptors = []


def get_lambda_descriptors():
	return _lambda_descriptors


def get_cloudwatch_url(context, region="us-east-1"):
	baseurl = "https://console.aws.amazon.com/cloudwatch/home"
	tpl = "?region=%s#logEventViewer:group=%s;stream=%s"
	return baseurl + tpl % (
		region, context.log_group_name, context.log_stream_name,
	)


def lambda_handler(
	runtime="python3.6", cpu_seconds=60, memory=128, name=None, handler=None,
	stream_name=None, stream_batch_size=1, trap_exceptions=True, tracing=True,
	requires_vpc_access=False
):
	"""Indicates the decorated function is a AWS Lambda handler.

	The following standard lifecycle services are provided:
		- Sentry reporting for all Exceptions that propagate
		- Capturing a standard set of metrics for Influx
		- Making sure all connections to the DB are closed
		- Capturing metadata to facilitate deployment

	Args:
	- cpu_seconds - The seconds the function can run before it is terminated. Default: 60
	- memory - The number of MB allocated to the lambda at runtime. Default: 128
	- name - The name for the Lambda on AWS. Default: func.__name__
	- handler - The entry point for the function. Default: handlers.<func.__name__>
	- stream_name - The kinesis stream this lambda will listen on
	- stream_batch_size - How many records per invocation it will consume from kinesis
	- trap_exceptions - Trapping exceptions will prevent Lambda from retrying on failure
	"""

	def inner_lambda_handler(func):
		global _lambda_descriptors

		lambda_name = name if name else func.__name__

		for descriptor in _lambda_descriptors:
			if descriptor["name"] == lambda_name:
				raise RuntimeError("Duplicate lambads defined with name \"%s\"" % lambda_name)

		_lambda_descriptors.append({
			"runtime": runtime,
			"memory": memory,
			"cpu_seconds": cpu_seconds,
			"name": lambda_name,
			"handler": handler if handler else "handlers.%s" % func.__name__,
			"stream_name": stream_name if stream_name else None,
			"stream_batch_size": stream_batch_size,
			"requires_vpc_access": requires_vpc_access
		})

		@wraps(func)
		def wrapper(event, context):
			cloudwatch_url = get_cloudwatch_url(context)

			# Provide additional metadata to sentry in case the exception
			# gets trapped and reported within the function.
			# Tags context can be used to group exceptions
			sentry.tags_context({
				"aws_function_name": context.function_name
			})
			# Extra context is just attached to the exception in Sentry
			extra_context = {
				"aws_log_group_name": context.log_group_name,
				"aws_log_stream_name": context.log_stream_name,
				"aws_cloudwatch_url": get_cloudwatch_url(context),
				"event": event,
			}

			if tracing:
				extra_context["shortid"] = get_shortid(event)
				extra_context["upload_url"] = "https://hsreplay.net/uploads/upload/%s/" % (
					extra_context["shortid"]
				)

			sentry.extra_context(extra_context)

			try:
				measurement = "%s_duration_ms" % (func.__name__)
				with influx_timer(
					measurement,
					timestamp=now(),
					cloudwatch_url=cloudwatch_url
				):
					return func(event, context)
			except Exception as e:
				log.exception("Got an exception: %r", e)
				sentry.captureException()

				if not trap_exceptions:
					raise
			finally:
				from django import db
				db.connections.close_all()

		return wrapper

	return inner_lambda_handler
