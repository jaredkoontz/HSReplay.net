from django.conf.urls import include, url
from rest_framework.routers import DefaultRouter

from hsreplaynet.ads.views import AdUnitUpdateView
from hsreplaynet.analytics.urls import api_urlpatterns as analytics_urlpatterns
from hsreplaynet.decks.api import (
	ArchetypeViewSet, DeckDetailView, DeckFeedbackView, GetOrCreateDeckView, MyDecksAPIView
)
from hsreplaynet.features.api import FeatureViewSet, SetFeatureView

from . import views
from .legacy import AuthTokenViewSet, CreateAccountClaimView
from .partner import views as partner_views


router = DefaultRouter()
router.register(r"archetypes", ArchetypeViewSet)
router.register(r"features", FeatureViewSet)
router.register(r"uploads", views.games.UploadEventViewSet)
router.register(r"packs", views.packs.PackViewSet)
router.register(r"tokens", AuthTokenViewSet)
router.register(r"webhooks", views.webhooks.WebhookViewSet)

urlpatterns = [
	url(r"^v1/account/$", views.accounts.UserDetailsView.as_view()),
	url(r"^v1/account/claim_token/$", views.accounts.ClaimTokenAPIView.as_view()),
	url(r"^v1/account/social/twitch/$", views.accounts.TwitchSocialAccountListView.as_view()),
	url(r"^v1/account/unlink/$", views.accounts.UnlinkBlizzardAccountView.as_view()),
	url(
		r"^v1/blizzard_accounts/(?P<hi>\d+)/(?P<lo>\d+)/$",
		views.accounts.UpdateBlizzardAccountView.as_view()
	),
	url(r"^v1/claim_account/$", CreateAccountClaimView.as_view()),
	url(r"^v1/collection/$", views.collections.CollectionView.as_view()),
	url(
		r"^v1/collection/upload_request/$",
		views.collections.CollectionURLPresigner.as_view()
	),
	url(r"^v1/analytics/decks/summary/$", MyDecksAPIView.as_view()),
	url(r"^v1/decks/$", GetOrCreateDeckView.as_view()),
	url(r"^v1/decks/(?P<shortid>\w+)/$", DeckDetailView.as_view()),
	url(r"^v1/decks/(?P<shortid>\w+)/feedback/$", DeckFeedbackView.as_view()),
	url(r"^v1/games/$", views.games.GameReplayList.as_view()),
	url(r"^v1/games/(?P<shortid>.+)/$", views.games.GameReplayDetail.as_view()),
	url(r"^v1/analytics/global/$", views.analytics.GlobalAnalyticsQueryView.as_view()),
	url(r"^v1/analytics/personal/$", views.analytics.PersonalAnalyticsQueryView.as_view()),
	url(r"^v1/features/(?P<name>[\w-]+)/$", SetFeatureView.as_view()),
	url(r"^v1/live/", include("hsreplaynet.api.live.urls")),
	url(r"^api-auth/", include("rest_framework.urls", namespace="rest_framework")),
	url(r"v1/ads/(?P<name>[\w\d-]+)/$", AdUnitUpdateView.as_view()),

	# Partner stats API
	url(r"^v1/partner-stats/archetypes/$", partner_views.ArchetypesView.as_view()),
	url(r"^v1/partner-stats/cards/$", partner_views.CardsView.as_view()),
	url(r"^v1/partner-stats/classes/$", partner_views.ClassesView.as_view()),
]

urlpatterns += analytics_urlpatterns

urlpatterns += [url(r"v1/", include(router.urls))]
