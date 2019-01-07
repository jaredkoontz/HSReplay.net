from datetime import timedelta

import requests
from django.core.cache import caches

from hsreplaynet.utils.redis import (
	CappedDataFeed, RedisCounter, RedisPopularityDistribution, RedisProxy, RedisSet
)


class PopularityWinrateDistribution:
	def __init__(self, redis, name, max_items=9, bucket_size=5, ttl=600, use_lua=None):
		self.name = name
		self.max_items = max_items
		self.bucket_size = bucket_size
		self.observations = RedisPopularityDistribution(
			redis,
			name="%s_OBSERVATIONS" % self.name,
			namespace="POPULARITY",
			ttl=ttl,
			max_items=self.max_items,
			bucket_size=self.bucket_size,
			use_lua=use_lua
		)
		self.wins = RedisPopularityDistribution(
			redis,
			name="%s_WINS" % self.name,
			namespace="POPULARITY",
			ttl=ttl,
			max_items=self.max_items,
			bucket_size=self.bucket_size,
			use_lua=use_lua
		)

	def increment(self, key, win=False, as_of=None):
		self.observations.increment(key, as_of=as_of)
		if win:
			self.wins.increment(key, as_of=as_of)

	def distribution(self, start_ts, end_ts):
		games = self.observations.distribution(
			start_ts=start_ts,
			end_ts=end_ts,
		)
		wins = self.wins.distribution(
			start_ts=start_ts,
			end_ts=end_ts,
		)
		result = {}
		for key, val in games.items():
			result[key] = {
				"games": val,
				"wins": wins.get(key, 0)
			}
		return result


def get_player_class_distribution(game_type, redis_client=None, ttl=3200, use_lua=None):
	if redis_client:
		redis = redis_client
	else:
		redis = get_live_stats_redis()

	name = "PLAYER_CLASS_%s" % game_type
	return PopularityWinrateDistribution(redis, name=name, ttl=ttl, use_lua=use_lua)


def get_played_cards_distribution(game_type, redis_client=None, ttl=600, use_lua=None):
	if redis_client:
		redis = redis_client
	else:
		redis = get_live_stats_redis()

	name = "PLAYED_CARDS_%s" % game_type
	return RedisPopularityDistribution(
		redis,
		name=name,
		namespace="POPULARITY",
		ttl=ttl,
		max_items=5000,
		bucket_size=5,
		use_lua=use_lua
	)


def get_live_stats_redis():
	return caches["live_stats"].client.get_client()


def get_replay_feed(comparator=None):
	return CappedDataFeed(
		redis=get_live_stats_redis(),
		name="REPLAY_FEED",
		max_items=1000,
		period=60,
		comparator=comparator,
		fast_backfill=True
	)


def get_daily_game_counter():
	return RedisCounter(
		redis=get_live_stats_redis(),
		name="DAILY_GAME_COUNTER",
		bucket_size=int(timedelta(days=1).total_seconds()),
		ttl=int(timedelta(days=14).total_seconds())
	)


def get_daily_contributor_set():
	return RedisSet(
		redis=get_live_stats_redis(),
		name="DAILY_CONTRIBUTORS",
		bucket_size=int(timedelta(days=1).total_seconds()),
		ttl=int(timedelta(days=14).total_seconds())
	)


def get_twitch_proxy(ttl=60):
	def fetch(usernames):
		headers = {
			"Client-ID": "k0lqdqxso1o3knvydfheacq3jbqidg"
		}

		# Fetch user data so we can convert from name to id
		# (Stream status responses only contain ids and are sorted
		# by popularity)
		response = requests.get(
			url=(
				"https://api.twitch.tv/helix/users?%s" % "&".join(
					[("login=%s" % u) for u in usernames]
				)
			),
			headers=headers
		)
		if response.status_code != requests.codes.ok:
			return []
		user_ids = dict()
		for user in response.json()["data"]:
			user_ids[user["id"]] = user["login"]

		results = []
		cursor = None
		while True:
			params = [("user_login=%s" % u) for u in usernames]
			if cursor:
				params.append("after=%s" % cursor)
			response = requests.get(
				url="https://api.twitch.tv/helix/streams?%s" % ("&".join(params)),
				headers=headers
			)
			if response.status_code != requests.codes.ok:
				return []
			json = response.json()
			cursor = json["pagination"]["cursor"] if json["pagination"] else None
			if json["data"]:
				for data in json["data"]:
					results.append({
						"key": user_ids[data["user_id"]],
						"value": data
					})
			if len(results) >= len(usernames) or not cursor:
				break
		return results

	return RedisProxy(
		redis=get_live_stats_redis(),
		name="TWITCH_STREAM_PROXY",
		ttl=ttl,
		fetch=fetch
	)
