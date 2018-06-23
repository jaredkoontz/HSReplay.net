from django.core.paginator import Paginator
from django.db import connections
from django.urls import NoReverseMatch, reverse
from django.utils.functional import cached_property
from django.utils.html import format_html


class EstimatedCountPaginator(Paginator):
	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		self.object_list.count = self.count

	@cached_property
	def count(self):
		if self.object_list.query.where:
			return self.object_list.count()

		db_table = self.object_list.model._meta.db_table
		cursor = connections[self.object_list.db].cursor()
		cursor.execute("SELECT reltuples FROM pg_class WHERE relname = %s", (db_table, ))
		result = cursor.fetchone()
		if not result:
			return 0
		return int(result[0])


def admin_urlify(column):
	def inner(obj):
		_obj = getattr(obj, column)
		if _obj is None:
			return "-"
		try:
			url = _obj.get_absolute_url()
		except (AttributeError, NoReverseMatch):
			url = ""
		admin_pattern = "admin:%s_%s_change" % (_obj._meta.app_label, _obj._meta.model_name)
		admin_url = reverse(admin_pattern, args=[_obj.pk])

		ret = format_html('<a href="{url}">{obj}</a>', url=admin_url, obj=_obj)
		if url:
			ret += format_html(' (<a href="{url}">View</a>)', url=url)
		return ret
	inner.short_description = column.replace("_", " ")
	return inner
