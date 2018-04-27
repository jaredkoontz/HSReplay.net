from collections import defaultdict
from datetime import datetime, timedelta

from allauth.socialaccount.models import SocialAccount
from django.core.cache import caches
from django.http import Http404
from hearthstone.enums import BnetGameType
from rest_framework.response import Response
from rest_framework.views import APIView

from .distributions import (
	get_daily_contributor_set, get_daily_game_counter, get_live_stats_redis,
	get_played_cards_distribution, get_player_class_distribution, get_replay_feed
)


_PLAYER_CLASS_CACHE = defaultdict(dict)
_REPLAY_FEED_CACHE = defaultdict()
_WEEKLY_GAMES_COUNT = defaultdict()
_PLAYED_CARDS_CACHE = defaultdict(dict)


def _get_base_ts(bucket_size=5):
	current_ts = datetime.utcnow()
	td = timedelta(seconds=60, microseconds=current_ts.microsecond)
	base_ts = current_ts - td
	base_ts = base_ts - timedelta(seconds=(base_ts.second % bucket_size))
	return base_ts


def _get_most_recent_tick_ts(tick=5):
	redis = get_live_stats_redis()
	seconds_since_epoch, microseconds_into_current_second = redis.time()
	current_ts = datetime.utcfromtimestamp(seconds_since_epoch)

	td = timedelta(microseconds=current_ts.microsecond)
	most_recent_tick_ts = current_ts - td
	most_recent_tick_ts = most_recent_tick_ts - timedelta(
		seconds=(most_recent_tick_ts.second % tick)
	)
	return most_recent_tick_ts


def _validate_game_type(game_type_name: str):
	if not hasattr(BnetGameType, game_type_name):
		raise Http404("Invalid GameType")


class LiveReplayFeedView(APIView):
	def get(self, request):
		current_ts = datetime.utcnow().timestamp()

		if _REPLAY_FEED_CACHE.get("as_of", 0) + 5 < current_ts:
			feed = get_replay_feed()
			_REPLAY_FEED_CACHE["as_of"] = current_ts
			_REPLAY_FEED_CACHE["payload"] = feed.get(200)

		data = {"data": _REPLAY_FEED_CACHE.get("payload", [])}
		return Response(data=data)


class WeeklyGamesCountView(APIView):
	def get(self, request):
		current_ts = datetime.utcnow().timestamp()

		if _WEEKLY_GAMES_COUNT.get("as_of", 0) + 5 < current_ts:
			counter = get_daily_game_counter()
			contributors = get_daily_contributor_set()
			_WEEKLY_GAMES_COUNT["as_of"] = current_ts
			_WEEKLY_GAMES_COUNT["payload"] = {
				"games_today": counter.get_count(0, 0),
				"games_weekly": counter.get_count(1, 7),
				"contributors_today": contributors.get_count(0, 0),
				"contributors_weekly": contributors.get_count(1, 7)
			}

		data = {"data": _WEEKLY_GAMES_COUNT.get("payload", {})}

		return Response(data=data)


class PlayerClassDistributionView(APIView):
	def get(self, request, game_type_name: str) -> Response:
		_validate_game_type(game_type_name)

		# How many seconds back in time to start.
		lookback = int(request.GET.get("lookback", 600))
		# How many seconds are in the window we calculate the distribution over.
		window = int(request.GET.get("window", 300))
		# How many seconds between data points.
		tick = int(request.GET.get("tick", 5))

		player_class_popularity = get_player_class_distribution(game_type_name)

		# base_ts ensures we generate the result at most once per bucket_size seconds
		most_recent_tick_ts = _get_most_recent_tick_ts(tick=tick)
		start_ts = most_recent_tick_ts - timedelta(seconds=lookback)
		end_ts = start_ts + timedelta(seconds=window)

		if _PLAYER_CLASS_CACHE[game_type_name].get("as_of", None) != most_recent_tick_ts:
			result = []
			while end_ts <= most_recent_tick_ts:
				data = player_class_popularity.distribution(
					start_ts=start_ts,
					end_ts=end_ts
				)
				result.append({
					"ts": int(end_ts.timestamp()),
					"data": data
				})
				start_ts = start_ts + timedelta(seconds=tick)
				end_ts = start_ts + timedelta(seconds=window)

			_PLAYER_CLASS_CACHE[game_type_name]["as_of"] = most_recent_tick_ts
			_PLAYER_CLASS_CACHE[game_type_name]["payload"] = result

		data = {"data": _PLAYER_CLASS_CACHE[game_type_name].get("payload", [])}
		return Response(data=data)


class PlayedCardsDistributionView(APIView):
	eligible_game_types = [
		BnetGameType.BGT_RANKED_WILD,
		BnetGameType.BGT_RANKED_STANDARD,
		BnetGameType.BGT_ARENA
	]

	def get(self, request):
		# base_ts ensures we generate the result at most once per bucket_size seconds
		base_ts = _get_base_ts(bucket_size=5)

		if _PLAYER_CLASS_CACHE["ALL"].get("as_of", None) != base_ts:
			payload = {}
			for game_type in self.eligible_game_types:
				played_cards_popularity = get_played_cards_distribution(game_type.name)
				result = []
				for i in range(0, 61, 5):
					end_ts = base_ts + timedelta(seconds=i)
					start_ts = end_ts - timedelta(seconds=300)
					data = played_cards_popularity.distribution(
						start_ts=start_ts,
						end_ts=end_ts,
						limit=20
					)
					result.append({
						"ts": int(end_ts.timestamp()),
						"data": data
					})
				payload[game_type.name] = result

			_PLAYER_CLASS_CACHE["ALL"]["as_of"] = base_ts
			_PLAYER_CLASS_CACHE["ALL"]["payload"] = payload

		data = _PLAYER_CLASS_CACHE["ALL"].get("payload", {})
		return Response(data=data)


class GameTypePlayedCardsDistributionView(APIView):
	def get(self, request, game_type_name: str) -> Response:
		_validate_game_type(game_type_name)

		played_cards_popularity = get_played_cards_distribution(game_type_name)

		# base_ts ensures we generate the result at most once per bucket_size seconds
		base_ts = _get_base_ts(bucket_size=5)

		if _PLAYED_CARDS_CACHE[game_type_name].get("as_of") != base_ts:
			result = []
			for i in range(0, 61, 5):
				end_ts = base_ts + timedelta(seconds=i)
				start_ts = end_ts - timedelta(seconds=300)
				data = played_cards_popularity.distribution(
					start_ts=start_ts,
					end_ts=end_ts,
					limit=10
				)
				result.append({
					"ts": int(end_ts.timestamp()),
					"data": data
				})
			_PLAYED_CARDS_CACHE[game_type_name]["as_of"] = base_ts
			_PLAYED_CARDS_CACHE[game_type_name]["payload"] = result

		data = {"data": _PLAYED_CARDS_CACHE[game_type_name].get("payload", [])}
		return Response(data=data)


class StreamingNowView(APIView):
	def _get_data(self):
		cache = caches["live_stats"]

		cache_key = "StreamingNowView::get"
		cached = cache.get(cache_key)
		if cached:
			return cached

		# Need direct client access for keys list
		client = cache.client.get_client()
		ret = []

		for k in client.keys(":*:twitch_*"):
			details = cache.get(k.decode()[3:])

			if not details or not details.get("deck") or not details.get("hero"):
				# Skip the obvious garbage
				continue

			twitch_user_id = details.pop("twitch_user_id")
			try:
				socialaccount = SocialAccount.objects.get(uid=twitch_user_id, provider="twitch")
			except SocialAccount.DoesNotExist:
				# Maybe it was deleted since or something
				continue

			ebs_settings = socialaccount.user.settings.get("twitch_ebs", {})
			if not ebs_settings.get("promote_on_hsreplaynet", True):
				# User has explicitly opted out of stream promotion
				continue

			details["twitch"] = {
				"name": socialaccount.extra_data.get("name"),
				"display_name": socialaccount.extra_data.get("display_name"),
				"_id": socialaccount.extra_data.get("_id"),
			}

			ret.append(details)

		cache.set(cache_key, ret, timeout=30)

		return ret

	def get(self, request):
		return Response(data=self._get_data())
