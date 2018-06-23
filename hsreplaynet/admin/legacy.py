from django.contrib import admin

from hearthsim.identity.api.models import APIKey


@admin.register(APIKey)
class APIKeyAdmin(admin.ModelAdmin):
	list_display = ("__str__", "email", "website", "api_key", "enabled", "token_count")
	search_fields = ("full_name", "email", "website")
	list_filter = ("enabled", )
	exclude = ("tokens", )
	readonly_fields = ("api_key", )
	show_full_result_count = False

	def token_count(self, obj):
		return obj.tokens.count()
