from datetime import datetime

from django.conf import settings

from hsredshift.analytics.scheduling import QueryRefreshPriority
from hsreplaynet.utils import influx, log


def trigger_if_stale(parameterized_query, run_local=False, priority=None):
	did_preschedule = False
	result = False

	as_of = parameterized_query.result_as_of
	if as_of is not None:
		staleness = int((datetime.utcnow() - as_of).total_seconds())
	else:
		staleness = None

	if parameterized_query.result_is_stale or run_local:
		attempt_request_triggered_query_execution(parameterized_query, run_local, priority)
		result = True
	elif staleness and staleness > settings.MINIMUM_QUERY_REFRESH_INTERVAL:
		did_preschedule = True
		parameterized_query.preschedule_refresh()

	query_fetch_metric_fields = {
		"count": 1,
	}

	if staleness:
		query_fetch_metric_fields["staleness"] = staleness

	query_fetch_metric_fields.update(
		parameterized_query.supplied_non_filters_dict
	)

	influx.influx_metric(
		"redshift_response_payload_staleness",
		query_fetch_metric_fields,
		query_name=parameterized_query.query_name,
		did_preschedule=did_preschedule,
		**parameterized_query.supplied_filters_dict
	)

	return result


def attempt_request_triggered_query_execution(
	parameterized_query,
	run_local=False,
	priority=None
):
	do_personal = settings.REDSHIFT_TRIGGER_PERSONALIZED_DATA_REFRESHES_FROM_QUERY_REQUESTS
	if run_local or settings.REDSHIFT_TRIGGER_CACHE_REFRESHES_FROM_QUERY_REQUESTS:
		execute_query(parameterized_query, run_local, priority)
	elif do_personal and parameterized_query.is_personalized:
		execute_query(parameterized_query, run_local, priority)
	else:
		log.debug("Triggering query from web app is disabled")


def execute_query(parameterized_query, run_local=False, priority=None):
	if run_local:
		# IMMEDIATE Will cause the query to get run synchronously
		log.info("run_local async refresh for: %s" % parameterized_query.cache_key)
		parameterized_query.schedule_refresh(
			priority=QueryRefreshPriority.IMMEDIATE
		)
		# _do_execute_query_work(parameterized_query)
		# Uncomment to cut-over to async redshift queries
	else:
		# This will queue the query for refresh as resources are available
		log.info("Scheduling refresh for: %s (priority=%s)" % (
			parameterized_query.unload_key,
			priority,
		))
		parameterized_query.schedule_refresh(
			priority=priority,
		)

	# # It's safe to launch multiple attempts to execute for the same query
	# # Because the dogpile lock will only allow one to execute
	# # But we can save resources by not even launching the attempt
	# # If we see that the lock already exists
	# if not _lock_exists(parameterized_query.cache_key):
	# 	log.info("No lock already exists for query. Will attempt to execute async.")
	#
	# 	if settings.ENV_AWS and settings.PROCESS_REDSHIFT_QUERIES_VIA_LAMBDA:
	# 		# In PROD use Lambdas so the web-servers don't get overloaded
	# 		from hsreplaynet.utils.aws.clients import LAMBDA
	# 		LAMBDA.invoke(
	# 			FunctionName="execute_redshift_query",
	# 			InvocationType="Event",  # Triggers asynchronous invocation
	# 			Payload=_to_lambda_payload(parameterized_query),
	# 		)
	# 	else:
	# 		_do_execute_query_work(parameterized_query)
	# else:
	# 	msg = "An async attempt to run this query is in-flight. Will not launch another."
	# 	log.info(msg)
