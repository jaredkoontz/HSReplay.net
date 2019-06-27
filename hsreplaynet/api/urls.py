from django.urls import include, path
from rest_framework.routers import DefaultRouter

from hsreplaynet.analytics.urls import api_urlpatterns as analytics_urlpatterns
from hsreplaynet.decks.api import (
	ArchetypeViewSet, DeckDetailView, DeckFeedbackView, GetOrCreateDeckView, MyDecksAPIView
)
from hsreplaynet.features.api import FeatureViewSet, SetFeatureView

from . import views
from .legacy import AuthTokenViewSet, CreateAccountClaimView
from .views import leaderboard as leaderboard_views


router = DefaultRouter()
router.register(r"archetypes", ArchetypeViewSet)
router.register(r"features", FeatureViewSet)
router.register(r"uploads", views.games.UploadEventViewSet)
router.register(r"packs", views.packs.PackViewSet)
router.register(r"tokens", AuthTokenViewSet)
router.register(r"webhooks", views.webhooks.WebhookViewSet)

urlpatterns = [
	path("v1/account/", views.accounts.UserDetailsView.as_view()),
	path("v1/account/claim_token/", views.accounts.ClaimTokenAPIView.as_view()),
	path("v1/account/social/twitch/", views.accounts.TwitchSocialAccountListView.as_view()),
	path("v1/account/unlink/", views.accounts.UnlinkBlizzardAccountView.as_view()),
	path("v1/account/redeem/", views.features.RedeemCodeView.as_view()),
	path("v1/ads/<str:name>/", views.ads.AdUnitView.as_view()),
	path(
		"v1/blizzard_accounts/<int:hi>/<int:lo>/",
		views.accounts.UpdateBlizzardAccountView.as_view()
	),
	path("v1/claim_account/", CreateAccountClaimView.as_view()),
	path("v1/collection/", views.collections.CollectionView.as_view()),
	path(
		"v1/collection/upload_request/",
		views.collections.CollectionURLPresigner.as_view()
	),
	path("v1/collection/visibility/", views.collections.CollectionVisibilityView.as_view()),
	path("v1/analytics/decks/summary/", MyDecksAPIView.as_view()),
	path("v1/decks/", GetOrCreateDeckView.as_view()),
	path("v1/decks/<str:shortid>/", DeckDetailView.as_view()),
	path("v1/decks/<str:shortid>/feedback/", DeckFeedbackView.as_view()),
	path("v1/games/", views.games.GameReplayList.as_view()),
	path("v1/games/<str:shortid>/", views.games.GameReplayDetail.as_view()),
	path("v1/analytics/global/", views.analytics.GlobalAnalyticsQueryView.as_view()),
	path("v1/analytics/personal/", views.analytics.PersonalAnalyticsQueryView.as_view()),
	path("v1/features/<str:name>/", SetFeatureView.as_view()),
	path("v1/live/", include("hsreplaynet.api.live.urls")),
	path("v1/vods/", views.vods.VodListView.as_view()),
	path("v1/vods/index/", views.vods.VodIndexView.as_view()),
	path("api-auth/", include("rest_framework.urls", namespace="rest_framework")),

	# Partner stats API
	path("v1/partner-stats/", include("hsreplaynet.api.partner.urls")),

	# Leaderboard API
	path("v1/leaderboard/", leaderboard_views.DelegatingLeaderboardView.as_view())
]

urlpatterns += analytics_urlpatterns

urlpatterns += [path("v1/", include(router.urls))]
