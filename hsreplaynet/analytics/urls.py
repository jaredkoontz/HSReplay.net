from django.conf.urls import url

from . import views


urlpatterns = [
	url(
		r"^query/(?P<name>\w+)/$", views.fetch_query_results,
		name="analytics_fetch_query_results"
	),
	url(
		r"^local/query/(?P<name>\w+)/$", views.fetch_local_query_results,
		name="analytics_fetch_local_query_results"
	),
	url(
		r"^evict/(?P<name>\w+)/$", views.evict_query_from_cache,
		name="analytics_evict_from_cache"
	),
	url(
		r"^evictall/(?P<name>\w+)/$", views.evict_all_from_cache,
		name="analytics_evict_all_from_cache"
	),
	url(
		r"^refresh/(?P<name>\w+)/$", views.refresh_query_from_cache,
		name="analytics_refresh_from_cache"
	),
	url(
		r"^refreshall/(?P<name>\w+)/$", views.refresh_all_from_cache,
		name="analytics_refresh_all_from_cache"
	),
	url(
		r"^release/semaphore/(?P<name>\w+)/$", views.release_semaphore,
		name="analytics_release_semaphore"
	),
	url(
		r"^clustering/list/(?P<game_format>\w+)/$",
		views.list_clustering_data,
		name="analytics_list_clustering_data"
	),
	url(
		r"^clustering/data/live/(?P<game_format>\w+)/$",
		views.live_clustering_data,
		name="analytics_live_clustering_data"
	),
	url(
		r"^clustering/data/(?P<id>\d+)/$",
		views.clustering_details,
		name="analytics_clustering_details"
	),
	url(
		r"^clustering/data/(?P<snapshot_id>\d+)/(?P<cluster_id>\d+)/$",
		views.SingleClusterUpdateView.as_view(),
		name="analytics_update_cluster_archetype"
	),
	url(
		r"^clustering/data/latest/(?P<game_format>\w+)/$",
		views.latest_clustering_data,
		name="analytics_latest_clustering_data"
	),
	url(
		r"^meta/preview/$",
		views.meta_preview,
		name="analytics_meta_preview"
	),
]

api_urlpatterns = [
	url(
		r"^v1/analytics/query/(?P<name>\w+)/$", views.fetch_query_results,
		name="analytics_api_fetch_query_results"
	),
]
