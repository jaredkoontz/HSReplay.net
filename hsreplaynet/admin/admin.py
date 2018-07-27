# flake8: noqa
from django.contrib import admin

from .accounts import *
from .legacy import *
from .models import AdUnit


@admin.register(AdUnit)
class AdsAdmin(admin.ModelAdmin):
	list_display = ("name", "description", "enabled")
	list_filter = ("enabled", )
