"""Lambdas written to be executed as a cron operation.

The cron schedule for these must be setup via the AWS Web Console.
"""
from hsreplaynet.uploads.models import RedshiftStagingTrack
from hsreplaynet.utils.instrumentation import lambda_handler


@lambda_handler(
	cpu_seconds=300,
	requires_vpc_access=True,
	tracing=False,
	memory=512,
)
def do_redshift_etl_maintenance(event, context):
	"""A periodic job to orchestrate Redshift ETL Maintenance"""
	RedshiftStagingTrack.objects.do_maintenance()
