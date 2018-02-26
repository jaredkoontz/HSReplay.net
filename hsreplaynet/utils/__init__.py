import datetime
import logging
from uuid import UUID
from dateutil.relativedelta import relativedelta
from django.http import Http404
from django.shortcuts import get_object_or_404
from . import checks  # noqa (needed to register the checks)


def get_logger(name="hsreplaynet", level=logging.DEBUG):
	logger = logging.getLogger(name)
	logger.setLevel(level)

	return logger


log = get_logger()


def delete_file(name):
	"""
	Delete a file by name from the default storage
	"""
	from django.core.files.storage import default_storage
	if default_storage.exists(name):
		default_storage.delete(name)


def guess_ladder_season(timestamp):
	epoch = datetime.datetime(2014, 1, 1, tzinfo=timestamp.tzinfo)
	epoch_season = 1
	delta = relativedelta(timestamp, epoch)
	months = (delta.years * 12) + delta.months
	return epoch_season + months


def get_uuid_object_or_404(cls, version=4, **kwargs):
	"""
	Helper that validates every kwarg as a valid UUID
	This avoids ValueError when passing a bad hex string
	to get_object_or_404().
	"""
	for k, v in kwargs.items():
		try:
			kwargs[k] = UUID(str(v), version=version)
		except ValueError:
			raise Http404("Object not found")
	return get_object_or_404(cls, **kwargs)


_CARD_DATA_CACHE = {}


def card_db():
	if "db" not in _CARD_DATA_CACHE:
		from hearthstone.cardxml import load_dbf
		db, _ = load_dbf()
		_CARD_DATA_CACHE["db"] = db
	return _CARD_DATA_CACHE["db"]
