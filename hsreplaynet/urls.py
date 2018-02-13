from django.conf import settings
from django.conf.urls import include, url
from django.views.generic import RedirectView

from .games.views import ReplayDetailView, ReplayEmbedView
from .web.views import DownloadsView, HomeView


urlpatterns = [
	url(r"^$", HomeView.as_view(), name="home"),
	url(r"^analytics/", include("hsreplaynet.analytics.urls")),
	url(r"^games/", include("hsreplaynet.games.urls")),
	url(r"^uploads/", include("hsreplaynet.uploads.urls")),

	# Direct link to replays
	url(r"^replay/(?P<id>\w+)$", ReplayDetailView.as_view(), name="games_replay_view"),
	url(r"^replay/(?P<id>\w+)/embed$", ReplayEmbedView.as_view(), name="games_replay_embed"),
]

if not settings.ENV_LAMBDA:
	from django.contrib.flatpages.views import flatpage
	from django.contrib.sitemaps.views import sitemap
	from .billing.views import PremiumDetailView
	from .web.sitemap import SITEMAPS

	# These pages are not registered on Lambda as they are not needed there
	urlpatterns += [
		url(r"^admin/", include("hsreplaynet.admin.urls")),
		url(r"^api/", include("hsreplaynet.api.urls")),
		url(r"^articles/", include("hsreplaynet.articles.urls")),
		url(r"^account/", include("hsreplaynet.accounts.urls")),
		url(r"^account/billing/", include("hsreplaynet.billing.urls")),
		url(r"^comments/", include("django_comments.urls")),
		url(r"^premium/$", PremiumDetailView.as_view(), name="premium"),
		url(r"^contact/$", flatpage, {"url": "/contact/"}, name="contact_us"),
		url(r"^about/premium/$", RedirectView.as_view(pattern_name="premium", permanent=True)),
		url(r"^about/privacy/$", flatpage, {"url": "/about/privacy/"}, name="privacy_policy"),
		url(r"^about/tos/$", flatpage, {"url": "/about/tos/"}, name="terms_of_service"),
		url(r"^downloads/", DownloadsView.as_view(), name="downloads"),
		url(r"^features/", include("hsreplaynet.features.urls")),
		url(r"^live/", include("hsreplaynet.live.urls")),
		url(r"^profile/", include("hsreplaynet.profiles.urls")),
		url(r"^pages/", include("django.contrib.flatpages.urls")),
		url(r"^oauth2/", include("hearthsim.identity.oauth2.urls")),
		url(r"^ref/", include("django_reflinks.urls")),
		# decks and cards
		url(r"^", include("hsreplaynet.decks.urls")),
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
