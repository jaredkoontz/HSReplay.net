from datetime import date

from allauth.account.views import LoginView as BaseLoginView
from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import redirect, render
from django.utils.http import is_safe_url
from django.utils.translation import gettext_lazy as _
from django.views.generic import RedirectView, TemplateView, View
from hearthstone.enums import CardClass

from ..html import RequestMetaMixin


SITE_DESCRIPTION = _("Watch and share Hearthstone replays directly from your web browser. \
Explore advanced statistics about decks and cards based on millions of games per week.")

CARD_IMAGE_URL = "https://art.hearthstonejson.com/v1/256x/%s.jpg"

HERO_IDS = {
	CardClass.DRUID: "HERO_06",
	CardClass.HUNTER: "HERO_05a",
	CardClass.MAGE: "HERO_08a",
	CardClass.PALADIN: "HERO_04a",
	CardClass.PRIEST: "HERO_09a",
	CardClass.ROGUE: "HERO_03a",
	CardClass.SHAMAN: "HERO_02a",
	CardClass.WARLOCK: "HERO_07a",
	CardClass.WARRIOR: "HERO_01a",
}


class HomeView(View):
	template_name = "home.html"

	def get(self, request):
		request.head.base_title = ""
		request.head.title = _("HSReplay.net - Unleash your potential")
		request.head.add_meta(
			{"name": "description", "content": SITE_DESCRIPTION},
			{"property": "og:description", "content": SITE_DESCRIPTION},
			{"name": "twitter:card", "content": "summary"},
		)
		try:
			from hsreplaynet.settings import PROMOTED_STREAMER_BY_DAY
			streamer = PROMOTED_STREAMER_BY_DAY.get(date.today().weekday(), None)
			context = {
				"promoted_streamer": streamer
			} if streamer else None
		except Exception:
			context = None
		return render(request, self.template_name, context)


class ArticlesRedirectView(RedirectView):
	permanent = True
	query_string = True

	base_url = "https://articles.hsreplay.net"
	redirect_map = {
		"1": "/2017/01/07/december-2016-updates/",
		"3": "/2017/01/20/popular-legendaries-in-gadgetzan/",
		"4": "/2017/02/08/mulligan-luck-in-the-arena/",
		"5": "/2017/03/13/shaking-up-the-meta-patch-7-1-in-numbers/",
		"6": "/2017/03/24/deep-dive-into-kazakus/",
		"7": "/2017/04/04/introducing-hsreplay-net-statistics/",
		"9": "/2017/04/08/class-performance-in-the-ungoro-meta/",
		"10": "/2017/04/12/raycs-quest-warrior-guide/",
		"11": "/2017/04/13/time-to-adapt/",
		"12": "/2017/04/25/quest-completion-statistics-an-overview/",
		"14": "/2017/05/03/pace-of-the-meta-ungoro-vs-gadgetzan/",
		"13": "/2017/05/11/wrapping-up-april-2017/",
		"16": "/2017/06/15/deep-dive-into-curious-glimerroot/",
		"17": "/2017/07/13/just-for-fun-top-includes-at-rank-floors/",
		"18": "/2017/08/07/the-caverns-below-impact-of-the-nerf/",
		"20": "/2017/08/12/two-days-into-the-frozen-throne-meta/",
		"22": "/2017/08/13/how-long-are-frozen-throne-games/",
		"21": "/2017/08/13/the-best-death-knight-decks-for-every-class/",
		"23": "/2017/08/14/introducing-my-decks-and-my-statistics/",
		"24": "/2017/08/15/how-good-is-skulking-geist/",
		"25": "/2017/08/17/death-knight-hero-performance-overview/",
		"26": "/2017/08/21/tracking-diversity-in-the-hearthstone-meta/",
		"28": "/2017/09/05/deep-dive-into-spreading-plague/",
		"27": "/2017/09/06/paypal-support-is-finally-here/",
		"29": "/2017/10/08/big-priest-by-the-numbers/",
		"30": "/2017/10/26/twitch-extension-for-hearthstone-deck-tracker/",
		"31": "/2017/11/03/the-keleseth-effect/",
		"33": "/2017/12/22/two-weeks-of-kobolds-and-some-catacombs/",
		"34": "/2017/12/25/deep-dive-into-temporus/",
		"35": "/2017/11/27/quests-death-knights-and-legendary-weapons-showdown/",
		"36": "/2018/02/01/a-worlds-to-remember/",
	}

	def get_redirect_url(self, *args, **kwargs):
		if kwargs["pk"] == "latest.atom":
			# feed to feed redirect
			path = "/rss/"
		else:
			# Find the correct path in the redirect map, otherwise go to base_url
			path = self.redirect_map.get(kwargs["pk"], "/")
		return self.base_url + path


class LoginView(BaseLoginView):
	def get(self, request):
		request.head.base_title = ""
		request.head.title = "Sign in to HSReplay.net"
		return super().get(request)


class SimpleReactView(RequestMetaMixin, TemplateView):
	template_name = "react_base.html"
	base_template = "base.html"
	bundle = ""
	bundles = ()

	def get_context_data(self, **kwargs):
		context = super().get_context_data(**kwargs)
		context["base_template"] = self.base_template
		context["bundle"] = self.bundle
		if self.bundles:
			context["bundles"] = self.bundles
		else:
			context["bundles"] = (self.bundle,)
		context["react_context"] = self.get_react_context()
		return context

	def get_react_context(self):
		return {}


class DownloadsView(SimpleReactView):
	title = "Downloads"
	stylesheets = (
		{"href": settings.FONTAWESOME_CSS_URL, "integrity": settings.FONTAWESOME_CSS_INTEGRITY},
	)
	bundle = "downloads"

	def get_react_context(self):
		return {
			"hdt_download_url": settings.HDT_DOWNLOAD_URL,
			"hstracker_download_url": settings.HSTRACKER_DOWNLOAD_URL,
		}


class PingView(View):
	def get(self, request):
		return HttpResponse("OK")


class SetLocaleView(View):
	success_url = "/"

	def get_next(self):
		next = self.request.GET.get("next", "")
		if next and is_safe_url(next, allowed_hosts=None):
			return next
		return self.success_url

	def get(self, request):
		locale = request.GET.get("hl", "")

		response = redirect(self.get_next())

		if locale and locale in settings.LANGUAGE_MAP:
			if request.user.is_authenticated:
				request.user.locale = locale
				request.user.save()
			else:
				response.set_cookie(
					settings.LANGUAGE_COOKIE_NAME, locale,
					max_age=settings.LANGUAGE_COOKIE_AGE,
					path=settings.LANGUAGE_COOKIE_PATH,
					domain=settings.LANGUAGE_COOKIE_DOMAIN
				)

		return response
