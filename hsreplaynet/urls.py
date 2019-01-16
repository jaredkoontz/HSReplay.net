from django.conf import settings
from django.conf.urls import include, url
from django.contrib.flatpages.views import flatpage
from django.contrib.sitemaps.views import sitemap
from django.contrib.staticfiles.views import serve
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
	url(r"^$", HomeView.as_view(), name="home"),

	# Single pages
	url(r"^about/privacy/$", flatpage, {"url": "/about/privacy/"}, name="privacy_policy"),
	url(r"^about/third-parties/$", flatpage, {"url": "/about/third-parties/"}),
	url(r"^about/tos/$", flatpage, {"url": "/about/tos/"}, name="terms_of_service"),
	url(r"^contact/$", flatpage, {"url": "/contact/"}, name="contact_us"),
	url(r"^download/", RedirectView.as_view(pattern_name="downloads", permanent=False)),
	url(r"^downloads/", DownloadsView.as_view(), name="downloads"),
	url(r"^i18n/contribute/$", RedirectView.as_view(
		url=settings.I18N_CONTRIBUTE_URL, permanent=False
	)),
	url(r"^i18n/setprefs/$", SetLocaleView.as_view()),
	url(r"^ping/$", PingView.as_view()),
	url(r"^premium/$", PremiumDetailView.as_view(), name="premium"),
	url(r"^redeem/$", RedirectView.as_view(pattern_name="redeem_code", permanent=False)),
	url(
		r"^redeem/(?P<code>[\w-]+)$", RedeemCodeRedirectView.as_view(),
		name="redeem_code_pretty"
	),
	url(r"^features/redeem/$", RedeemCodeView.as_view(), name="redeem_code"),

	# Replays
	url(
		r"^uploads/upload/(?P<shortid>[\w-]+)/$", UploadDetailView.as_view(),
		name="upload_detail"
	),
	url(r"^games/$", RedirectView.as_view(pattern_name="my_replays", permanent=False)),
	url(r"^games/mine/$", MyReplaysView.as_view(), name="my_replays"),
	url(r"^replay/(?P<id>\w+)$", ReplayDetailView.as_view(), name="games_replay_view"),
	url(
		r"^replay/(?P<shortid>\w+)/annotated_xml$",
		AnnotatedReplayView.as_view(), name="annotated_replay"
	),
	url(r"^replay/(?P<id>\w+)/embed$", ReplayEmbedView.as_view(), name="games_replay_embed"),

	# Includes
	url(r"^admin/", include("hsreplaynet.admin.urls")),
	url(r"^analytics/", include("hsreplaynet.analytics.urls")),
	url(r"^api/", include("hsreplaynet.api.urls")),
	url(r"^account/", include("hsreplaynet.web.account_urls")),
	url(r"^account/billing/", include("hsreplaynet.billing.urls")),
	url(r"^email/bounces/", include("django_bouncy.urls")),
	url(r"^pages/", include("django.contrib.flatpages.urls")),
	url(r"^ref/", include("django_reflinks.urls")),

	# archetypes
	url(r"^discover/$", DiscoverView.as_view(), name="discover"),
	url(r"^meta/$", MetaOverviewView.as_view(), name="meta_overview"),
	url(
		r"^archetypes/$",
		RedirectView.as_view(pattern_name="meta_overview", permanent=False)
	),
	url(
		r"^archetypes/(?P<id>\d+)/(?P<slug>[\w-]+)?",
		ArchetypeDetailView.as_view(), name="archetype_detail"
	),

	# cards
	url(r"^cards/$", CardsView.as_view(), name="cards"),
	url(r"^cards/editor/", CardEditorView.as_view(), name="card_editor"),
	url(r"^cards/gallery/$", RedirectView.as_view(pattern_name="cards", permanent=True)),
	url(r"^cards/mine/$", MyCardsView.as_view(), name="my_cards"),
	url(r"^cards/(?P<pk>\w+)/(?P<slug>[\w-]+)?", CardDetailView.as_view(), name="card_detail"),
	url(
		r"^collection/(?P<region>\d+)/(?P<lo>\d+)/$",
		CollectionView.as_view(),
		name="collection"
	),
	url(r"^collection/mine/$", MyCollectionView.as_view(), name="collection"),

	# decks
	url(r"^decks/$", DecksView.as_view(), name="decks"),
	url(r"^decks/mine/$", MyDecksView.as_view(), name="my_decks"),
	url(r"^decks/trending/", TrendingDecksView.as_view(), name="trending_decks"),
	url(r"^decks/(?P<id>\w+)/$", DeckDetailView.as_view(), name="deck_detail"),

	# TODO: move me to api module
	url(
		r"^clusters/latest/(?P<game_format>\w+)/(?P<player_class>\w+)/(?P<cluster_id>\w+)/"
		r"(?P<dbf_id_str>\w+)/",

		ClusterSnapshotRequiredCardsUpdateView.as_view(),
		name="update_cluster_required_cards"
	),
	url(
		r"^clusters/latest/(?P<game_format>\w+)/(?P<player_class>\w+)/(?P<cluster_id>\w+)/",
		ClusterSnapshotUpdateView.as_view(), name="update_cluster_archetype"
	),

	# mailchimp
	url(r"^mailchimp/webhook/$", MailchimpWebhookView.as_view(), name="mailchimp_webhook"),

	# oauth2
	url(r"^oauth2/login/$", OAuth2LoginView.as_view(), name="oauth2_login"),
	url(r"^oauth2/authorize/$", OAuth2AuthorizeView.as_view(), name="authorize"),
	url(r"^oauth2/revoke/$", OAuth2RevokeView.as_view(), name="oauth2_revoke_access"),
	url(r"^oauth2/token/$", TokenView.as_view(), name="token"),
	url(
		r"^oauth2/application/reset_secret/$",
		OAuth2ResetSecretView.as_view(), name="oauth2_reset_secret"
	),
	url(
		r"^oauth2/revoke_all_tokens/$",
		OAuth2RevokeAllTokensView.as_view(), name="oauth2_revoke_all_tokens"
	),

	# profiles (currently unused)
	url(r"^profile/packs/$", PackListView.as_view(), name="profile_packs"),
	url(r"^leaderboards/$", LeaderboardsView.as_view(), name="profile_packs"),
	url(r"^profiles/(?P<user_id>\d+)/$", ProfileView.as_view(), name="profile_packs"),

	# redirects
	url(r"^articles/(?P<pk>[^/]+)?", ArticlesRedirectView.as_view()),

	# favicon (debug only)
	url(
		r"^favicon\.ico$", serve,
		kwargs={"path": "images/favicon.ico"},
	),

	# sitemaps
	url(
		r"^sitemap\.xml", sitemap, {"sitemaps": SITEMAPS},
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
			url(r"^__debug__/", include(debug_toolbar.urls)),
		]

	from django.conf.urls.static import static
	urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
