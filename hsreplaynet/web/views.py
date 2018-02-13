import json

from django.conf import settings
from django.views.generic import RedirectView, TemplateView
from hearthstone.enums import BnetGameType, CardClass

from ..analytics.views import fetch_query_results
from ..games.models import GameReplay
from .html import RequestMetaMixin


SITE_DESCRIPTION = "Watch and share Hearthstone replays directly from your web browser. \
Explore advanced statistics about decks and cards based on millions of games per week."

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


class HomeView(TemplateView):
	template_name = "home.html"

	def get_context_data(self, **kwargs):
		context = super().get_context_data(**kwargs)
		context["featured_replay"] = self.get_featured_replay()
		winrate_data = self.get_winrate_data()

		context["player_classes"] = []
		for card_class in CardClass:
			if not card_class.is_playable or card_class not in winrate_data:
				continue
			data = winrate_data[card_class]
			context["player_classes"].append({
				"standard_url": "/decks/#playerClasses=" + card_class.name,
				"wild_url": "/decks/#playerClasses=%s&gameType=%s" % (card_class.name, "RANKED_WILD"),
				"arena_url": "/cards/#playerClass=%s&gameType=%s" % (card_class.name, "ARENA"),
				"image_url": CARD_IMAGE_URL % HERO_IDS[card_class],
				"name": card_class.name.title(),
				"standard_winrate": data["standard"] if "standard" in data else 50,
				"wild_winrate": data["wild"] if "wild" in data else 50,
				"arena_winrate": data["arena"] if "arena" in data else 50,
			})

		return context

	def get_winrate_data(self):
		try:
			query_result = fetch_query_results(
				self.request, "player_class_performance_summary"
			)
			data = json.loads(query_result.content.decode("utf8"))["series"]["data"]
		except Exception:
			return {}

		ret = {}
		for c, values in data.items():
			class_key = CardClass[c]
			ret[class_key] = {"standard": 50, "wild": 50}
			for value in values:
				if value["game_type"] == BnetGameType.BGT_RANKED_STANDARD:
					winrate_key = "standard"
				elif value["game_type"] == BnetGameType.BGT_RANKED_WILD:
					winrate_key = "wild"
				elif value["game_type"] == BnetGameType.BGT_ARENA:
					winrate_key = "arena"
				ret[class_key][winrate_key] = value["win_rate"]

		return ret

	def get_featured_replay(self):
		id = getattr(settings, "FEATURED_GAME_ID", None)
		if not id:
			return

		try:
			game = GameReplay.objects.get(shortid=id)
		except GameReplay.DoesNotExist:
			game = None

		return game

	def get(self, request):
		request.head.base_title = ""
		request.head.title = "HSReplay.net - Hearthstone Statistics and Replays"
		request.head.add_meta(
			{"name": "description", "content": SITE_DESCRIPTION},
			{"property": "og:description", "content": SITE_DESCRIPTION},
			{"name": "twitter:card", "content": "summary"},
		)
		return super().get(request)


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
		# Find the correct path in the redirect map, otherwise go to base_url
		path = self.redirect_map.get(kwargs["pk"], "/")
		return self.base_url + path


class DownloadsView(RequestMetaMixin, TemplateView):
	template_name = "downloads.html"
	title = "Downloads"
	stylesheets = (
		{"href": settings.FONTAWESOME_CSS_URL, "integrity": settings.FONTAWESOME_CSS_INTEGRITY},
	)
