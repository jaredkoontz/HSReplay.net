from django.urls import path

from . import views


urlpatterns = [
	path(
		"query/<str:name>/", views.fetch_query_results,
		name="analytics_fetch_query_results"
	),
	path(
		"local/query/<str:name>/", views.fetch_local_query_results,
		name="analytics_fetch_local_query_results"
	),
	path(
		"evict/<str:name>/", views.evict_query_from_cache,
		name="analytics_evict_from_cache"
	),
	path(
		"evictall/<str:name>/", views.evict_all_from_cache,
		name="analytics_evict_all_from_cache"
	),
	path(
		"refresh/<str:name>/", views.refresh_query_from_cache,
		name="analytics_refresh_from_cache"
	),
	path(
		"refreshall/<str:name>/", views.refresh_all_from_cache,
		name="analytics_refresh_all_from_cache"
	),
	path(
		"release/semaphore/<str:name>/", views.release_semaphore,
		name="analytics_release_semaphore"
	),
	path(
		"clustering/list/<str:game_format>/",
		views.list_clustering_data,
		name="analytics_list_clustering_data"
	),
	path(
		"clustering/data/live/<str:game_format>/",
		views.live_clustering_data,
		name="analytics_live_clustering_data"
	),
	path(
		"clustering/data/<int:id>/",
		views.clustering_details,
		name="analytics_clustering_details"
	),
	path(
		"clustering/data/<int:snapshot_id>/<int:cluster_id>/",
		views.SingleClusterUpdateView.as_view(),
		name="analytics_update_cluster_archetype"
	),
	path(
		"clustering/data/latest/<str:game_format>/",
		views.latest_clustering_data,
		name="analytics_latest_clustering_data"
	),
	path(
		"meta/preview/",
		views.meta_preview,
		name="analytics_meta_preview"
	),
	path(
		"mulligan/preview/",
		views.mulligan_preview,
		name="analytics_mulligan_preview"
	)
]

api_urlpatterns = [
	path(
		"v1/analytics/query/<str:name>/", views.fetch_query_results,
		name="analytics_api_fetch_query_results"
	),
]
