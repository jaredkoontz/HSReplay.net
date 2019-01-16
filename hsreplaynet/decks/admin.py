from django.contrib import admin

from hsreplaynet.admin.utils import EstimatedCountPaginator, admin_urlify

from .models import (
	Archetype, ArchetypeName, ArchetypeSuggestion, ClassClusterSnapshot,
	ClusterSetSnapshot, ClusterSnapshot, Deck, Include
)


class IncludeInline(admin.TabularInline):
	model = Include
	raw_id_fields = ("card", )
	extra = 15


@admin.register(Deck)
class DeckAdmin(admin.ModelAdmin):
	list_display = ("__str__", "archetype", "created")
	inlines = (IncludeInline, )
	readonly_fields = ("shortid", )
	raw_id_fields = ("guessed_full_deck", )
	show_full_result_count = False
	paginator = EstimatedCountPaginator

	def get_ordering(self, request):
		return ["-id"]

	def view_on_site(self, deck):
		if not deck.is_full_deck:
			return None
		return deck.get_absolute_url()


@admin.register(ClusterSetSnapshot)
class ClusterSetSnapshotAdmin(admin.ModelAdmin):
	list_display = (
		"__str__",
		"as_of",
		"game_format",
		"latest",
		"live_in_production"
	)

	def update_archetype_signatures(self, request, queryset):
		cluster_set = queryset.get()
		cluster_set.update_archetype_signatures()

	actions = (
		update_archetype_signatures,
	)


@admin.register(ClassClusterSnapshot)
class ClassClusterSnapshotAdmin(admin.ModelAdmin):
	list_display = (
		"__str__",
		"cluster_set",
		"player_class",
	)
	list_filter = (
		"cluster_set__live_in_production",
		"cluster_set__latest",
		"cluster_set__game_format"
	)


@admin.register(ClusterSnapshot)
class ClusterSnapshotAdmin(admin.ModelAdmin):
	list_display = (
		"id",
		"cluster_id",
		"experimental",
		admin_urlify("archetype"),
		"name",
		"rules"
	)
	list_filter = (
		"class_cluster__cluster_set__latest",
		"class_cluster__cluster_set__live_in_production",
		"class_cluster__cluster_set__game_format",
		"class_cluster__player_class",
	)
	raw_id_fields = ("class_cluster", )
	readonly_fields = ("pretty_signature_html",)


@admin.register(Archetype)
class ArchetypeAdmin(admin.ModelAdmin):
	list_display = (
		"__str__",
		"player_class_name",
		"standard_signature_pretty",
		"standard_ccp_signature_pretty",
		"wild_signature_pretty",
		"wild_signature_as_of",
		"standard_signature_as_of"
	)
	list_filter = ("player_class", )
	readonly_fields = (
		"standard_signature_pretty",
		"standard_ccp_signature_pretty",
		"wild_signature_pretty"
	)

	def get_queryset(self, request):
		qs = super().get_queryset(request)
		return qs.filter(deleted=False)

	def player_class_name(self, obj):
		return "%s" % obj.player_class.name
	player_class_name.short_description = "Class"
	player_class_name.admin_order_field = "player_class"

	def get_ordering(self, request):
		return ["player_class", "name"]

	def set_deleted(self, request, queryset):
		queryset.update(deleted=True)

	actions = (
		set_deleted,
	)


@admin.register(ArchetypeSuggestion)
class ArchetypeSuggestionAdmin(admin.ModelAdmin):
	list_display = (
		"__str__",
		"deck",
		"as_of",
	)
	list_filter = ()


@admin.register(ArchetypeName)
class ArchetypeNameAdmin(admin.ModelAdmin):
	list_display = (
		"__str__",
		"player_class",
		"created",
	)
	list_filter = ("player_class",)
