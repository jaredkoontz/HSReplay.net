import boto3
import botocore
from django.conf import settings
from .clients import KINESIS, LAMBDA, S3


def get_kinesis_stream_arn_from_name(name):
	stream = KINESIS.describe_stream(StreamName=name)
	if stream:
		return stream["StreamDescription"]["StreamARN"]


def publish_raw_upload_batch_to_processing_stream(
	raw_uploads, stream=settings.KINESIS_UPLOAD_PROCESSING_STREAM_NAME
):
	records = []
	for upload in raw_uploads:
		records.append({
			"Data": upload.kinesis_data,
			"PartitionKey": upload.kinesis_partition_key,
		})

	return KINESIS.put_records(Records=records, StreamName=stream)


def is_processing_disabled():
	current_configuration = S3.get_bucket_notification_configuration(
		Bucket=settings.S3_RAW_LOG_UPLOAD_BUCKET
	)

	has_notification_configs = "LambdaFunctionConfigurations" in current_configuration
	if not has_notification_configs:
		return False

	lambda_notifications = current_configuration["LambdaFunctionConfigurations"]
	return len(lambda_notifications) == 0


def enable_processing_raw_uploads():
	prod_processing_lambda = LAMBDA.get_function(
		FunctionName="ProcessS3CreateObjectV1",
		Qualifier="PROD"
	)
	prod_notification_config = {
		"LambdaFunctionArn": prod_processing_lambda["Configuration"]["FunctionArn"],
		"Events": ["s3:ObjectCreated:*"],
		"Id": "TriggerProdLambdaOnLogCreate",
		"Filter": {
			"Key": {
				"FilterRules": [
					{"Name": "suffix", "Value": "power.log"},
					{"Name": "prefix", "Value": "raw"},
				]
			}
		}
	}

	canary_processing_lambda = LAMBDA.get_function(
		FunctionName="ProcessS3CreateObjectV1",
		Qualifier="CANARY"
	)
	canary_notification_config = {
		"LambdaFunctionArn": canary_processing_lambda["Configuration"]["FunctionArn"],
		"Events": ["s3:ObjectCreated:*"],
		"Id": "TriggerCanaryLambdaOnLogCreate",
		"Filter": {
			"Key": {
				"FilterRules": [
					{"Name": "suffix", "Value": "canary.log"},
					{"Name": "prefix", "Value": "raw"},
				]
			}
		}
	}

	S3.put_bucket_notification_configuration(
		Bucket=settings.S3_RAW_LOG_UPLOAD_BUCKET,
		NotificationConfiguration={
			"LambdaFunctionConfigurations": [
				prod_notification_config,
				canary_notification_config
			]
		}
	)


def disable_processing_raw_uploads():
	# Remove any existing event notification rules by
	# putting an empty configuration on the bucket
	S3.put_bucket_notification_configuration(
		Bucket=settings.S3_RAW_LOG_UPLOAD_BUCKET,
		NotificationConfiguration={}
	)


def list_all_objects_in(bucket, prefix=None):
	list_response = S3.list_objects_v2(Bucket=bucket, Prefix=prefix)
	if list_response["KeyCount"] > 0:
		objects = list_response["Contents"]
		while objects:
			yield objects.pop(0)
			if list_response["IsTruncated"] and not objects:
				list_response = S3.list_objects_v2(
					Bucket=bucket,
					Prefix=prefix,
					ContinuationToken=list_response["NextContinuationToken"]
				)
				objects += list_response["Contents"]


def get_bucket_size(bucket_name):
	count = 0
	bucket = boto3.resource("s3").Bucket(bucket_name)
	for obj in bucket.objects.all():
		count += 1

	return count


def s3_object_exists(bucket, key):
	exists = False

	try:
		S3.head_object(
			Bucket=bucket,
			Key=key
		)
	except botocore.exceptions.ClientError as e:
		if e.response["Error"]["Code"] == "404":
			exists = False
		else:
			raise
	else:
		exists = True

	return exists
