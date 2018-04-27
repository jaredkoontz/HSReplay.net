from django.urls import path

from . import views


urlpatterns = [
	path(
		"distributions/player_class/<game_type_name>/",
		views.fetch_player_class_distribution,
		name="live_fetch_player_class_distribution"
	),
	path(
		"distributions/played_cards/",
		views.fetch_played_cards_distribution,
		name="live_fetch_played_cards_distribution"
	),
	path(
		"distributions/played_cards/<game_type_name>/",
		views.fetch_played_cards_distribution_for_gametype,
		name="live_fetch_played_cards_distribution_for_gametype"
	),
	path(
		"games_count/weekly/",
		views.fetch_weekly_games_count,
		name="live_weekly_games_count"
	),
	path(
		"replay_feed/", views.fetch_replay_feed, name="live_replay_feed"
	),
	path(
		"streaming-now/", views.StreamingNowView.as_view(),
	)
]
