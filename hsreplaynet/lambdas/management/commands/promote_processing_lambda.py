import sys
import time
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils.timezone import now

from hsreplaynet.uploads.models import UploadEvent, UploadEventStatus
from hsreplaynet.uploads.processing import queue_upload_events_for_reprocessing
from hsreplaynet.utils.aws import is_processing_disabled
from hsreplaynet.utils.aws.clients import LAMBDA


class Command(BaseCommand):
	help = "Promote the ProcessS3CreateObjectV1 lambda into PROD"
	canary_function_name = "ProcessS3CreateObjectV1"

	def add_arguments(self, parser):
		parser.add_argument(
			"--bypass_canary", action="store_true",
			help="Skip the canary stage and promote directly to PROD"
		)
		parser.add_argument(
			"--max-wait-seconds", type=int, default=180,
			help="Maximum amount of seconds to wait for Canary"
		)
		parser.add_argument(
			"--min-canary-uploads", type=int, default=10,
			help="Minimum amount of Canary uploads to wait for"
		)

	def log(self, msg):
		self.stdout.write(msg)

	def set_canary_version(self, version):
		update_canary_result = LAMBDA.update_alias(
			FunctionName=self.canary_function_name,
			Name="CANARY",
			FunctionVersion=version,
		)
		self.log(
			"CANARY Alias updated to version: %s" % update_canary_result["FunctionVersion"]
		)
		return update_canary_result["FunctionVersion"]

	def set_prod_version(self, version):
		update_prod_result = LAMBDA.update_alias(
			FunctionName=self.canary_function_name,
			Name="PROD",
			FunctionVersion=version,
		)
		self.stdout.write(
			"PROD Alias updated to version: %s" % update_prod_result["FunctionVersion"]
		)
		return update_prod_result["FunctionVersion"]

	def handle(self, *args, **options):
		func_name = self.canary_function_name

		prod_alias = LAMBDA.get_alias(FunctionName=func_name, Name="PROD")
		self.log("PROD Alias starting at version: %s" % prod_alias["FunctionVersion"])

		canary_alias = LAMBDA.get_alias(FunctionName=func_name, Name="CANARY")
		self.log("CANARY Alias starting at version: %s" % canary_alias["FunctionVersion"])

		# Create new version
		self.stdout.write("Publishing new version...")
		new_version = LAMBDA.publish_version(FunctionName=func_name)
		new_version_num = new_version["Version"]
		self.log("New version is: %s" % new_version_num)

		# This causes the new code to start getting used on canary upload events.
		canary_period_start = now()
		self.set_canary_version(new_version_num)

		if options["bypass_canary"]:
			# We promote all aliases and return immediately.
			self.log("Bypassing canary stage and promoting immediately")
			self.set_prod_version(new_version_num)
			self.log("Finished.")
			return

		if is_processing_disabled():
			self.log("Processing is disabled so we will not see any canaries")
			self.log("Bypassing canary stage and promoting immediately")

			self.set_prod_version(new_version_num)

			self.log("Finished.")
			return

		# If we did not exit already, then we are doing a canary deployment.
		max_wait_seconds = options["max_wait_seconds"]
		max_wait_time = now() + timedelta(seconds=max_wait_seconds)

		min_canary_uploads = options["min_canary_uploads"]

		wait_for_more_canary_uploads = True
		try:
			while wait_for_more_canary_uploads:
				canary_uploads = UploadEvent.objects.filter(
					canary=True,
					created__gte=canary_period_start,
				).exclude(status__in=UploadEventStatus.processing_statuses())

				if canary_uploads.count() >= min_canary_uploads:
					wait_for_more_canary_uploads = False
				elif len(self.get_failed_canaries(canary_uploads.all())):
					# Exit early since some canaries have already failed
					wait_for_more_canary_uploads = False
				else:
					if now() > max_wait_time:
						msg = "Waited too long for canary events. Exiting."
						self.log(msg)
						raise RuntimeError(msg)

					self.log(
						"Found %i uploads... sleeping 5 seconds" % (canary_uploads.count())
					)
					time.sleep(5)

			self.log("%s canary upload events have been found" % (canary_uploads.count()))

			canary_failures = self.get_canary_failures_since(canary_period_start)

			if canary_failures:
				# We have canary failures, time to rollback.
				self.log("The following canary uploads have failed:")
				self.log(", ".join(u.shortid for u in canary_failures))
				self.log("Here is one of the failures:")
				self.log_canary_failure(canary_failures[0])
				raise RuntimeError("Failed canary events detected. Rolling back.")
		except Exception as err:

			# Revert the canary alias back to what PROD still points to
			prod_version = prod_alias["FunctionVersion"]
			self.log(str(err))
			self.log("CANARY will be reverted to version: %s" % prod_version)
			self.set_canary_version(prod_version)

			self.log("Initiating reprocessing to fix canary uploads")
			# Query again for all canary failures after reverting so we don't miss any
			canary_failures = self.get_canary_failures_since(canary_period_start)
			queue_upload_events_for_reprocessing(canary_failures, use_kinesis=True)
			self.log("Finished queuing canaries for reprocessing.")
			sys.exit(1)

		# We didn't have any canary failures so it's time to promote PROD.
		self.log("The canary version is a success! Promoting PROD.")
		self.set_prod_version(new_version_num)
		self.log("Finished.")

	def get_failed_canaries(self, canaries):
		acceptable_status = [
			UploadEventStatus.SUCCESS,
			UploadEventStatus.UNSUPPORTED_CLIENT,
			UploadEventStatus.UNSUPPORTED
		]

		canary_failures = [c for c in canaries if c.status not in acceptable_status]

		return canary_failures

	def get_canary_failures_since(self, canary_period_start):
		canary_uploads = UploadEvent.objects.filter(
			canary=True,
			created__gte=canary_period_start,
		).exclude(status__in=UploadEventStatus.processing_statuses())

		canaries = canary_uploads.all()
		return self.get_failed_canaries(canaries)

	def log_canary_failure(self, failed_canary):
		self.log("%s failed with the following message:" % (failed_canary.shortid))
		self.log(failed_canary.error)
