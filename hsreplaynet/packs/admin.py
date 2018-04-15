from django.contrib import admin

from hearthsim.identity.utils import admin_urlify as urlify

from .models import Pack, PackCard


class PackCardInline(admin.TabularInline):
	model = PackCard
	raw_id_fields = ("card", )
	extra = 5
	max_num = 5


@admin.register(Pack)
class PackAdmin(admin.ModelAdmin):
	date_hierarchy = "date"
	list_display = ("__str__", "booster_type", "date", urlify("user"))
	list_filter = ("booster_type", )
	raw_id_fields = ("user", "blizzard_account")
	search_fields = ("cards__name", "user__username")
	inlines = (PackCardInline, )
