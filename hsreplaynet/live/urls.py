from django.urls import path

from . import views


urlpatterns = [
	path(
		"distributions/player_class/<game_type_name>/",
		views.PlayerClassDistributionView.as_view()
	),
	path(
		"distributions/played_cards/",
		views.PlayedCardsDistributionView.as_view()
	),
	path(
		"distributions/played_cards/<game_type_name>/",
		views.GameTypePlayedCardsDistributionView.as_view()
	),
	path("games_count/weekly/", views.WeeklyGamesCountView.as_view()),
	path("replay_feed/", views.LiveReplayFeedView.as_view()),
	path("streaming-now/", views.StreamingNowView.as_view()),
]
