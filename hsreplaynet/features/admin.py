from django.contrib import admin

from .models import Feature, FeatureInvite, FeatureInviteAlias


@admin.register(Feature)
class FeatureAdmin(admin.ModelAdmin):
	list_display = ("name", "status", "read_only")
	list_filter = ("status", "read_only", )


@admin.register(FeatureInvite)
class FeatureInviteAdmin(admin.ModelAdmin):
	list_display = (
		"__str__", "uuid", "use_count", "use_count", "max_uses", "expires", "created"
	)
	list_filter = ("features", )
	readonly_fields = ("use_count", )


@admin.register(FeatureInviteAlias)
class FeatureInviteAliasAdmin(admin.ModelAdmin):
	list_display = (
		"__str__", "invite", "redeemable", "redeemed_by", "redeemed_on"
	)
	raw_id_fields = ("invite", "redeemed_by")

	def get_readonly_fields(self, request, obj=None):
		if obj:
			return []
		else:
			return ["redeemed_by", "redeemed_on"]

	def redeemable(self, obj):
		return obj.is_valid
	redeemable.boolean = True
