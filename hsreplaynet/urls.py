from django.conf import settings
from django.contrib.flatpages.views import flatpage
from django.contrib.sitemaps.views import sitemap
from django.contrib.staticfiles.views import serve
from django.urls import include, path, re_path
from django.views.generic import RedirectView
from oauth2_provider.views import TokenView

from hsreplaynet.mailchimp.views import MailchimpWebhookView

from .decks.views import ClusterSnapshotRequiredCardsUpdateView, ClusterSnapshotUpdateView
from .web.sitemap import SITEMAPS
from .web.views import (
	ArticlesRedirectView, DownloadsView, HomeView, PingView,
	RedeemCodeRedirectView, RedeemCodeView, SetLocaleView
)
from .web.views.archetypes import ArchetypeDetailView, DiscoverView, MetaOverviewView
from .web.views.cards import CardDetailView, CardEditorView, CardsView, MyCardsView
from .web.views.collections import CollectionView, MyCollectionView
from .web.views.decks import DeckDetailView, DecksView, MyDecksView, TrendingDecksView
from .web.views.leaderboards import LeaderboardsView
from .web.views.oauth2 import (
	OAuth2AuthorizeView, OAuth2LoginView, OAuth2ResetSecretView,
	OAuth2RevokeAllTokensView, OAuth2RevokeView
)
from .web.views.premium import PremiumDetailView
from .web.views.profiles import PackListView, ProfileView
from .web.views.replays import (
	AnnotatedReplayView, MyReplaysView, ReplayDetailView, ReplayEmbedView, UploadDetailView
)


urlpatterns = [
	path("", HomeView.as_view(), name="home"),

	# Single pages
	path("about/privacy/", flatpage, {"url": "/about/privacy/"}, name="privacy_policy"),
	path("about/third-parties/", flatpage, {"url": "/about/third-parties/"}),
	path("about/tos/", flatpage, {"url": "/about/tos/"}, name="terms_of_service"),
	path("contact/", flatpage, {"url": "/contact/"}, name="contact_us"),
	path("download/", RedirectView.as_view(pattern_name="downloads", permanent=False)),
	path("downloads/", DownloadsView.as_view(), name="downloads"),
	path("i18n/contribute/", RedirectView.as_view(
		url=settings.I18N_CONTRIBUTE_URL, permanent=False
	)),
	path("i18n/setprefs/", SetLocaleView.as_view()),
	path("ping/", PingView.as_view()),
	path("premium/", PremiumDetailView.as_view(), name="premium"),
	path("redeem/", RedirectView.as_view(pattern_name="redeem_code", permanent=False)),
	path(
		"redeem/<str:code>", RedeemCodeRedirectView.as_view(),
		name="redeem_code_pretty"
	),
	path("features/redeem/", RedeemCodeView.as_view(), name="redeem_code"),

	# Replays
	path(
		"uploads/upload/<str:shortid>/", UploadDetailView.as_view(),
		name="upload_detail"
	),
	path("games/", RedirectView.as_view(pattern_name="my_replays", permanent=False)),
	path("games/mine/", MyReplaysView.as_view(), name="my_replays"),
	path("replay/<str:id>", ReplayDetailView.as_view(), name="games_replay_view"),
	path(
		"replay/<str:shortid>/annotated_xml",
		AnnotatedReplayView.as_view(), name="annotated_replay"
	),
	path("replay/<str:id>/embed", ReplayEmbedView.as_view(), name="games_replay_embed"),

	# Includes
	path("admin/", include("hsreplaynet.admin.urls")),
	path("analytics/", include("hsreplaynet.analytics.urls")),
	path("api/", include("hsreplaynet.api.urls")),
	path("account/", include("hsreplaynet.web.account_urls")),
	path("account/billing/", include("hsreplaynet.billing.urls")),
	path("email/bounces/", include("django_bouncy.urls")),
	path("pages/", include("django.contrib.flatpages.urls")),
	path("ref/", include("django_reflinks.urls")),

	# archetypes
	path("discover/", DiscoverView.as_view(), name="discover"),
	path("meta/", MetaOverviewView.as_view(), name="meta_overview"),
	path(
		"archetypes/",
		RedirectView.as_view(pattern_name="meta_overview", permanent=False)
	),
	re_path(
		r"^archetypes/(?P<id>\d+)/(?P<slug>[\w-]+)?",
		ArchetypeDetailView.as_view(), name="archetype_detail"
	),

	# cards
	path("cards/", CardsView.as_view(), name="cards"),
	path("cards/editor/", CardEditorView.as_view(), name="card_editor"),
	path("cards/gallery/", RedirectView.as_view(pattern_name="cards", permanent=True)),
	path("cards/mine/", MyCardsView.as_view(), name="my_cards"),
	re_path(
		r"^cards/(?P<pk>\w+)/(?P<slug>[\w-]+)?",
		CardDetailView.as_view(),
		name="card_detail"
	),
	path(
		"collection/<int:region>/<int:lo>/",
		CollectionView.as_view(),
		name="collection"
	),
	path("collection/mine/", MyCollectionView.as_view(), name="collection"),

	# decks
	path("decks/", DecksView.as_view(), name="decks"),
	path("decks/mine/", MyDecksView.as_view(), name="my_decks"),
	path("trending/", RedirectView.as_view(pattern_name="trending_decks", permanent=False)),
	path("decks/trending/", TrendingDecksView.as_view(), name="trending_decks"),
	re_path(r"^decks/(?P<id>([\w+=/])+)/$", DeckDetailView.as_view(), name="deck_detail"),

	# TODO: move me to api module
	path(
		"clusters/latest/<str:game_format>/<str:player_class>/<str:cluster_id>/"
		"<str:dbf_id_str>/",

		ClusterSnapshotRequiredCardsUpdateView.as_view(),
		name="update_cluster_required_cards"
	),
	path(
		"clusters/latest/<str:game_format>/<str:player_class>/<str:cluster_id>/",
		ClusterSnapshotUpdateView.as_view(), name="update_cluster_archetype"
	),

	# mailchimp
	path("mailchimp/webhook/", MailchimpWebhookView.as_view(), name="mailchimp_webhook"),

	# oauth2
	path("oauth2/login/", OAuth2LoginView.as_view(), name="oauth2_login"),
	path("oauth2/authorize/", OAuth2AuthorizeView.as_view(), name="authorize"),
	path("oauth2/revoke/", OAuth2RevokeView.as_view(), name="oauth2_revoke_access"),
	path("oauth2/token/", TokenView.as_view(), name="token"),
	path(
		"oauth2/application/reset_secret/",
		OAuth2ResetSecretView.as_view(), name="oauth2_reset_secret"
	),
	path(
		"oauth2/revoke_all_tokens/",
		OAuth2RevokeAllTokensView.as_view(), name="oauth2_revoke_all_tokens"
	),

	# profiles (currently unused)
	path("profile/packs/", PackListView.as_view(), name="profile_packs"),
	path("leaderboards/", LeaderboardsView.as_view(), name="profile_packs"),
	path("profiles/<int:user_id>/", ProfileView.as_view(), name="profile_packs"),

	# redirects
	re_path(r"^articles/(?P<pk>[^/]+)?", ArticlesRedirectView.as_view()),

	# favicon (debug only)
	path(
		"favicon.ico", serve,
		kwargs={"path": "images/favicon.ico"},
	),

	# sitemaps
	path(
		"sitemap.xml", sitemap, {"sitemaps": SITEMAPS},
		name="django.contrib.sitemaps.views.sitemap"
	),
]


if settings.DEBUG:
	try:
		import debug_toolbar
	except ImportError:
		pass
	else:
		urlpatterns += [
			path("__debug__/", include(debug_toolbar.urls)),
		]

	from django.conf.urls.static import static
	urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
