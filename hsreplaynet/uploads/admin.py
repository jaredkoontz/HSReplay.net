from django.contrib import admin
from django.utils.safestring import mark_safe

from hearthsim.identity.utils import EstimatedCountPaginator, admin_urlify as urlify

from .models import UploadEvent
from .processing import queue_upload_events_for_reprocessing


def queue_for_reprocessing(admin, request, queryset):
	queue_upload_events_for_reprocessing(queryset)


queue_for_reprocessing.short_description = "Queue for reprocessing"


@admin.register(UploadEvent)
class UploadEventAdmin(admin.ModelAdmin):
	actions = (queue_for_reprocessing, )
	list_display = (
		"__str__", "status", "tainted", urlify("token"),
		urlify("game"), "upload_ip", "created", "file", "user_agent"
	)
	list_filter = ("status", )
	readonly_fields = ("created", "processing_logs")
	search_fields = ("shortid", )
	show_full_result_count = False
	paginator = EstimatedCountPaginator

	def get_queryset(self, request):
		qs = super().get_queryset(request)
		return qs.prefetch_related("game__global_game__players")

	def processing_logs(self, obj):
		return mark_safe('<a href="%s">Cloudwatch Logs</a>' % (obj.cloudwatch_url))
	processing_logs.short_description = "Logs"
