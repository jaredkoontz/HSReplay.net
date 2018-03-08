from django.conf.urls import include, url
from rest_framework.routers import DefaultRouter

from hearthsim.identity.accounts.api import AuthTokenViewSet, CreateAccountClaimView
from hsreplaynet.analytics.urls import api_urlpatterns as analytics_urlpatterns
from hsreplaynet.decks.api import ArchetypeViewSet
from hsreplaynet.decks.urls import api_urlpatterns as decks_urlpatterns
from hsreplaynet.features.api import FeatureViewSet
from hsreplaynet.features.urls import api_urlpatterns as features_urlpatterns
from hsreplaynet.packs.api import PackViewSet

from . import views


router = DefaultRouter()
router.register(r"archetypes", ArchetypeViewSet)
router.register(r"features", FeatureViewSet)
router.register(r"uploads", views.games.UploadEventViewSet)
router.register(r"packs", PackViewSet)
router.register(r"tokens", AuthTokenViewSet)
router.register(r"webhooks", views.webhooks.WebhookViewSet)

urlpatterns = [
	url(r"^v1/account/$", views.accounts.UserDetailsView.as_view()),
	url(r"^v1/account/claim_token/$", views.accounts.ClaimTokenAPIView.as_view()),
	url(r"^v1/account/social/twitch/$", views.accounts.TwitchSocialAccountListView.as_view()),
	url(r"^v1/claim_account/$", CreateAccountClaimView.as_view()),
	url(r"^v1/comments/(?P<pk>\d+)/$", views.comments.CommentDetailView.as_view()),
	url(r"^v1/collection/$", views.collections.CollectionView.as_view()),
	url(
		r"^v1/collection/upload_request/$",
		views.collections.CollectionURLPresigner.as_view()
	),
	url(r"^v1/games/$", views.games.GameReplayList.as_view()),
	url(r"^v1/games/(?P<shortid>.+)/$", views.games.GameReplayDetail.as_view()),
	url(r"^v1/analytics/global/$", views.analytics.GlobalAnalyticsQueryView.as_view()),
	url(r"^v1/analytics/personal/$", views.analytics.PersonalAnalyticsQueryView.as_view()),
	url(r"^api-auth/", include("rest_framework.urls", namespace="rest_framework")),
]

urlpatterns += decks_urlpatterns
urlpatterns += analytics_urlpatterns
urlpatterns += features_urlpatterns

urlpatterns += [url(r"v1/", include(router.urls))]
