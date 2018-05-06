from django.conf import settings
from django.conf.urls import include, url
from django.contrib.flatpages.views import flatpage
from django.contrib.sitemaps.views import sitemap
from django.views.generic import RedirectView

from .billing.views import PremiumDetailView
from .games.views import AnnotatedReplayView, ReplayDetailView, ReplayEmbedView
from .web.sitemap import SITEMAPS
from .web.views import (
	ArticlesRedirectView, DownloadsView, HomeView, PingView, SetLocaleView
)
from .web.views.profiles import PackListView


urlpatterns = [
	url(r"^$", HomeView.as_view(), name="home"),

	# Single pages
	url(r"^about/privacy/$", flatpage, {"url": "/about/privacy/"}, name="privacy_policy"),
	url(r"^about/tos/$", flatpage, {"url": "/about/tos/"}, name="terms_of_service"),
	url(r"^contact/$", flatpage, {"url": "/contact/"}, name="contact_us"),
	url(r"^downloads/", DownloadsView.as_view(), name="downloads"),
	url(r"^i18n/setprefs/$", SetLocaleView.as_view()),
	url(r"^ping/$", PingView.as_view()),
	url(r"^premium/$", PremiumDetailView.as_view(), name="premium"),
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
	url(r"^comments/", include("django_comments.urls")),
	url(r"^features/", include("hsreplaynet.features.urls")),
	url(r"^games/", include("hsreplaynet.games.urls")),
	url(r"^api/v1/live/", include("hsreplaynet.live.urls")),
	url(r"^oauth2/", include("hearthsim.identity.oauth2.urls")),
	url(r"^pages/", include("django.contrib.flatpages.urls")),
	url(r"^ref/", include("django_reflinks.urls")),
	url(r"^uploads/", include("hsreplaynet.uploads.urls")),

	# decks and cards
	url(r"^", include("hsreplaynet.decks.urls")),

	# profiles (currently unused)
	url(r"^profile/packs/$", PackListView.as_view(), name="profile_packs"),

	# redirects
	url(r"^articles/(?P<pk>[^/]+)?", ArticlesRedirectView.as_view()),
	url(r"^about/premium/$", RedirectView.as_view(pattern_name="premium", permanent=True)),

	# sitemaps
	url(
		r"^sitemap\.xml", sitemap, {"sitemaps": SITEMAPS},
		name="django.contrib.sitemaps.views.sitemap"
	)
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
