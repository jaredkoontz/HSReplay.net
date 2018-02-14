import boto3
from django.conf import settings


def get_clients():
	return (
		boto3.client("iam"),
		boto3.client("firehose", region_name=settings.AWS_DEFAULT_REGION),
		boto3.client("kinesis", region_name=settings.AWS_DEFAULT_REGION),
		boto3.client("lambda", region_name=settings.AWS_DEFAULT_REGION),
		boto3.client("s3"),
		boto3.client("sqs", region_name=settings.AWS_DEFAULT_REGION),
	)


if not settings.CONNECT_TO_AWS:
	import moto

	# https://github.com/spulec/moto
	# If we're in an environment where we don't connect to upstream AWS
	# (such as local dev), the following mocks the AWS services we use.

	mocks = (
		moto.mock_iam,
		moto.mock_kinesis,
		moto.mock_lambda,
		moto.mock_s3,
		moto.mock_sqs
	)

	for mock in mocks:
		get_clients = mock(get_clients)


IAM, FIREHOSE, KINESIS, LAMBDA, S3, SQS = get_clients()
