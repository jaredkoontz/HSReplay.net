from datetime import datetime

from django.utils.translation import ugettext_lazy as _
from rest_framework import serializers


class IntEnumField(serializers.Field):
	default_error_messages = {
		"invalid_member": _("{input} is not a valid member of {enum}.")
	}

	def __init__(self, enum, *args, **kwargs):
		assert enum
		self.enum = enum
		super(IntEnumField, self).__init__(*args, **kwargs)

	def to_representation(self, value):
		return int(value)

	def to_internal_value(self, value):
		try:
			enum = self.enum(int(value))
		except ValueError:
			self.fail("invalid_member", input=value, enum=self.enum.__name__)
		return enum


class TimestampField(serializers.DateTimeField):
	precision = 1

	def __init__(self, precision=None, *args, **kwargs):
		if precision is not None:
			self.precision = precision
		super(TimestampField, self).__init__(*args, **kwargs)

	def to_representation(self, value):
		dt = datetime.utcfromtimestamp(value / self.precision)
		return super(TimestampField, self).to_representation(dt)

	def to_internal_value(self, value):
		dt = super(TimestampField, self).to_internal_value(value)
		return dt.timestamp() * self.precision
