import threading
from contextlib import contextmanager


class CountDownLatch:
	def __init__(self, count=1):
		self.count = count
		self.lock = threading.Condition()

	def count_down(self):
		with self.lock:
			self.count -= 1
			if self.count <= 0:
				self.lock.notify_all()

	def await_(self):
		with self.lock:
			while self.count > 0:
				self.lock.wait()


def acquire_redshift_lock(lock_ids, wait=False):
	"""
	Make a non-blocking (by default) attempt to claim an exclusive session level advisory lock
	in postgres for the supplied lock_ids argument.

	If wait=True then this will block until the lock is acquired.

	lock_ids must be an iterable of 1 bigint or 2 ints

	The lock will automatically be released when the DB session is closed for example
	at the end of a Lambda invocation.


	To inspect what locks have been acquired directly in Postgres use:
	`SELECT * FROM pg_locks WHERE locktype = 'advisory';`

	For additional details see:
	https://www.postgresql.org/docs/9.5/static/explicit-locking.html#ADVISORY-LOCKS
	https://www.postgresql.org/docs/9.5/static/functions-admin.html#FUNCTIONS-ADVISORY-LOCKS
	"""
	if not lock_ids:
		raise ValueError("lock_ids cannot be None")

	function_name = "pg_"

	if not wait:
		function_name += "try_"

	function_name += "advisory_lock"

	if len(lock_ids) == 1:
		command = "SELECT %s(%i);" % (function_name, lock_ids[0])
	elif len(lock_ids) == 2:
		command = "SELECT %s(%i, %i);" % (function_name, lock_ids[0], lock_ids[1])
	else:
		raise ValueError("lock_ids must have either 1 bigint or 2 ints")

	from django.db import connection
	cursor = connection.cursor()
	cursor.execute(command)
	acquired = cursor.fetchone()[0]
	return acquired


def release_redshift_lock(lock_ids):
	"""
	Attempt to release any locks claimed by acquire_redshift_lock(lock_id)

	Return True if the lock was released, and False if the lock was not held.
	"""
	if not lock_ids:
		raise ValueError("lock_id cannot be None")

	if len(lock_ids) == 1:
		command = "SELECT pg_advisory_unlock(%i);" % lock_ids[0]
	elif len(lock_ids) == 2:
		command = "SELECT pg_advisory_unlock(%i, %i);" % (lock_ids[0], lock_ids[1])
	else:
		raise ValueError("lock_ids must have either 1 bigint or 2 ints")

	from django.db import connection
	cursor = connection.cursor()
	cursor.execute(command)
	released = cursor.fetchone()[0]
	return released


@contextmanager
def advisory_lock(lock_ids, wait=False):
	acquired = acquire_redshift_lock(lock_ids, wait)
	try:
		yield acquired
	finally:
		if acquired:
			release_redshift_lock(lock_ids)
