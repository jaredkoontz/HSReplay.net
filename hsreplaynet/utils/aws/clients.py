import boto3
from django.conf import settings


def get_clients():
	if settings.CONNECT_TO_AWS:
		region = settings.AWS_DEFAULT_REGION
		return (
			boto3.client("iam"),
			boto3.client("firehose", region_name=region),
			boto3.client("kinesis", region_name=region),
			boto3.client("lambda", region_name=region),
			boto3.client("s3"),
			boto3.client("sqs", region_name=region),
		)
	else:
		return (
			None,
			boto3.client("firehose", endpoint_url="http://localhost:4573"),
			boto3.client("kinesis", endpoint_url="http://localhost:4568"),
			boto3.client("lambda", endpoint_url="http://localhost:4574"),
			boto3.client("s3", endpoint_url="http://localhost:4572"),
			boto3.client("sqs", endpoint_url="http://localhost:4576"),
		)


IAM, FIREHOSE, KINESIS, LAMBDA, S3, SQS = get_clients()
