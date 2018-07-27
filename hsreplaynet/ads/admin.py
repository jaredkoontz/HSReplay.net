from django.contrib import admin

from .models import AdUnit


@admin.register(AdUnit)
class FeatureAdmin(admin.ModelAdmin):
	list_display = ("name", "description", "enabled")
	list_filter = ("enabled", )
