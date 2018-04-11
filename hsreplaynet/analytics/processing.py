import copy
import json
import time
from collections import defaultdict
from datetime import datetime, timedelta
from random import seed, shuffle

from django.conf import settings
from django.db import models
from django.dispatch.dispatcher import receiver
from django.utils import timezone
from hearthstone.enums import BnetGameType, FormatType
from redis_lock import Lock as RedisLock
from redis_semaphore import Semaphore
from sqlalchemy.sql import and_

from hearthsim.identity.accounts.models import BlizzardAccount
from hsreplaynet.analytics.utils import (
	attempt_request_triggered_query_execution, execute_query, trigger_if_stale
)
from hsreplaynet.utils import log
from hsreplaynet.utils.aws import redshift
from hsreplaynet.utils.aws.sqs import write_messages_to_queue
from hsreplaynet.utils.influx import influx_metric


def _to_lambda_payload(parameterized_query):
	payload = {
		"query_name": parameterized_query.query_name,
		"supplied_parameters": parameterized_query.supplied_parameters
	}

	return json.dumps(payload)


def _do_execute_query(parameterized_query, wlm_queue=None):
	# This method should always be getting executed within a Lambda context

	# Distributed dog pile lock pattern
	# From: https://pypi.python.org/pypi/python-redis-lock
	log.info("About to attempt acquiring lock...")
	redis_client = redshift.get_redshift_cache_redis_client()

	with RedisLock(redis_client, parameterized_query.cache_key, expire=300):
		# Get a lock with a 5-minute lifetime since that's the maximum duration of a Lambda
		# to ensure the lock is held for as long as the Python process / Lambda is running.
		log.info("Lock acquired.")
		return _do_execute_query_work(parameterized_query, wlm_queue)


def _do_execute_query_work(parameterized_query, wlm_queue=None):
	if not parameterized_query.result_is_stale:
		log.info("Up-to-date cached data exists. Exiting without running query.")
	else:
		log.info("Cached data missing or stale. Executing query now.")
		# DO EXPENSIVE WORK
		start_ts = time.time()
		exception_raised = False
		exception_msg = None
		try:
			parameterized_query.refresh_result(wlm_queue)
		except Exception as e:
			exception_raised = True
			exception_msg = str(e)
			raise
		finally:
			end_ts = time.time()
			duration_seconds = round(end_ts - start_ts, 2)

			query_execute_metric_fields = {
				"duration_seconds": duration_seconds,
				"exception_message": exception_msg
			}
			query_execute_metric_fields.update(
				parameterized_query.supplied_non_filters_dict
			)

			influx_metric(
				"redshift_query_execute",
				query_execute_metric_fields,
				exception_thrown=exception_raised,
				query_name=parameterized_query.query_name,
				**parameterized_query.supplied_filters_dict
			)


def evict_locks_cache(params):
	redis_client = redshift.get_redshift_cache_redis_client()
	lock_signal_key = _get_lock_signal_key(params.cache_key)
	redis_client.delete(lock_signal_key)


def _get_lock_signal_key(cache_key):
	return "lock:%s" % cache_key


def _lock_exists(cache_key):
	lock_signal_key = _get_lock_signal_key(cache_key)
	redis_client = redshift.get_redshift_cache_redis_client()
	lock_signal = redis_client.get(lock_signal_key)
	return lock_signal is not None


class PremiumUserCacheWarmingContext:
	def __init__(self, user, blizzard_account_map):
		self.user = user
		self.blizzard_account_map = blizzard_account_map

	@classmethod
	def from_user(cls, user):
		time_horizon = timezone.now() - timedelta(days=30)
		blizzard_accounts = list(user.blizzard_accounts.all())
		blizzard_account_deck_map = defaultdict(lambda: defaultdict(set))
		for blizzard_account in blizzard_accounts:
			# Make sure this gets initialized if it exists
			# even when there are no games attached
			deck_map_for_account = blizzard_account_deck_map[blizzard_account]
			ggps = blizzard_account.globalgameplayer_set.select_related(
				"game", "deck_list"
			).filter(game__match_start__gte=time_horizon)
			for ggp in ggps.all():
				deck = ggp.deck_list
				if deck.size == 30:
					game_type = ggp.game.game_type
					deck_map_for_account[deck].add(game_type)

		return PremiumUserCacheWarmingContext(user, blizzard_account_deck_map)

	@property
	def blizzard_accounts(self):
		return self.blizzard_account_map.keys()

	def get_deck_map_for_account(self, account):
		return self.blizzard_account_map[account]


def warm_redshift_cache_for_user_context(context):
	# This should be called whenever a user becomes premium
	fill_personalized_query_queue([context])


def fill_global_query_queue(eligible_queries=None, filter_fresh_queries=True):
	queue_name = settings.REDSHIFT_ANALYTICS_QUERY_QUEUE_NAME
	messages = get_queries_for_cache_warming(eligible_queries)
	log.info("Generated %i global query permutations for cache warming." % len(messages))
	if filter_fresh_queries:
		messages = filter_freshly_cached_queries(messages)
		msg = "%i permutations remain after filtering fresh queries" % len(messages)
		log.info(msg)
	write_messages_to_queue(queue_name, messages)


def run_local_warm_queries(eligible_queries=None):
	messages = get_queries_for_cache_warming(eligible_queries)
	log.info("Generated %i global query permutations for cache warming." % len(messages))
	stale_queries = filter_freshly_cached_queries(messages)
	msg = "%i permutations remain after filtering fresh queries" % len(stale_queries)
	log.info(msg)
	for msg in stale_queries:
		query = redshift.get_redshift_query(msg["query_name"])
		parameterized_query = query.build_full_params(msg["supplied_parameters"])
		execute_query(parameterized_query, run_local=True)


_eligible_decks_cache = {}


def _get_global_stats_eligible_decks():
	query = redshift.get_redshift_query("list_decks_by_win_rate")
	standard_query = query.build_full_params(dict(
		TimeRange="LAST_30_DAYS",
		GameType="RANKED_STANDARD",
	))
	wild_query = query.build_full_params(dict(
		TimeRange="LAST_30_DAYS",
		GameType="RANKED_WILD",
	))

	digest_cache_missing = _eligible_decks_cache.get("eligible_decks", None) is None
	standard_as_of = _eligible_decks_cache.get("standard_as_of", None)
	standard_is_stale = standard_as_of != standard_query.result_as_of
	wild_as_of = _eligible_decks_cache.get("wild_as_of", None)
	wild_is_stale = wild_as_of != wild_query.result_as_of

	if digest_cache_missing or standard_is_stale or wild_is_stale:
		result = set()
		for player_class, decks in standard_query.response_payload["series"]["data"].items():
			for deck in decks:
				result.add(deck["digest"])
		for player_class, decks in wild_query.response_payload["series"]["data"].items():
			for deck in decks:
				result.add(deck["digest"])
		_eligible_decks_cache["standard_as_of"] = standard_query.result_as_of
		_eligible_decks_cache["wild_as_of"] = standard_query.result_as_of
		_eligible_decks_cache["eligible_decks"] = result

	return _eligible_decks_cache["eligible_decks"]


def enable_premium_accounts_in_redshift(accounts):
	from hsredshift.etl.models import premium_account
	session = redshift.get_new_redshift_session()

	for account in accounts:
		session.execute(premium_account.delete().where(and_(
			premium_account.c.region == int(account.region),
			premium_account.c.account_lo == account.account_lo,
		)))

		session.execute(premium_account.insert().values({
			"region": int(account.region),
			"account_lo": account.account_lo,
			"user_id": account.user_id,
			"as_of": timezone.now(),
			"active": True,
		}))

	session.commit()
	session.close()


def enable_premium_accounts_for_users_in_redshift(users):
	accounts = []
	for user in users:
		accounts.extend(user.blizzard_accounts.all())
	enable_premium_accounts_in_redshift(accounts)


@receiver(models.signals.post_save, sender=BlizzardAccount)
def sync_blizzard_account_to_redshift(sender, instance, **kwargs):
	if instance.user and instance.user.is_premium:
		enable_premium_accounts_in_redshift([instance])


def fill_personalized_query_queue(contexts, eligible_queries=None):
	queue_name = settings.REDSHIFT_ANALYTICS_QUERY_QUEUE_NAME
	messages = get_personalized_queries_for_cache_warming(
		contexts,
		eligible_queries
	)
	log.info("Generated %i personalized permutations for cache warming." % len(messages))
	stale_queries = filter_freshly_cached_queries(messages)
	msg = "%i personalized perms remain after filtering fresh queries" % len(stale_queries)
	log.info(msg)
	write_messages_to_queue(queue_name, stale_queries)


def _permutation_matches_game_types(perm, game_types):
	gt = perm.get("GameType", None)
	is_w = gt == "RANKED_WILD" and BnetGameType.BGT_RANKED_WILD in game_types
	is_s = gt == "RANKED_STANDARD" and BnetGameType.BGT_RANKED_STANDARD in game_types
	return is_w or is_s


def get_personalized_queries_for_cache_warming(
	contexts,
	eligible_queries=None,
	catalogue=None
):
	redshift_catalogue = catalogue if catalogue else redshift.get_redshift_catalogue()
	queries = []
	for query in redshift_catalogue.personalized_queries:
		is_eligible = eligible_queries is None or query.name in eligible_queries

		if query.cache_warming_enabled and is_eligible:
			for permutation in query.generate_personalized_parameter_permutation_bases():
				# Each permutation will still be missing a Region and account_lo value
				for ctx in contexts:
					for blizzard_account in ctx.blizzard_accounts:
						new_permutation = copy.copy(permutation)
						new_permutation["Region"] = blizzard_account.region.name
						new_permutation["account_lo"] = blizzard_account.account_lo
						if "deck_id" in query.get_available_non_filter_parameters():
							deck_map_for_account = ctx.get_deck_map_for_account(blizzard_account)

							for deck, gts in deck_map_for_account.items():
								if _permutation_matches_game_types(new_permutation, gts):
									new_permutation_for_deck = copy.copy(new_permutation)
									new_permutation_for_deck["deck_id"] = deck.id
									log.info("Warming: %s: %s", new_permutation_for_deck, query.name)
									queries.append({
										"query_name": query.name,
										"supplied_parameters": new_permutation_for_deck,
									})
						else:
							log.info("Warming: %s: %s", new_permutation, query.name)
							queries.append({
								"query_name": query.name,
								"supplied_parameters": new_permutation
							})

	return queries


def filter_freshly_cached_queries(messages):
	if not settings.ENV_AWS:
		# We can only reach the cache from inside AWS
		# So we cannot take advantage of this optimization outside AWS
		# Skipping filtering is okay as up-to-date queries will still
		# get skipped at query execution time
		return messages

	result = []
	for msg in messages:
		query = redshift.get_redshift_query(msg["query_name"])
		parameterized_query = query.build_full_params(msg["supplied_parameters"])

		if not parameterized_query.result_available or parameterized_query.result_is_stale:
			# Keep this message because the cache is stale
			result.append(msg)

	return result


def get_queries_for_cache_warming(eligible_queries=None):
	queries = []
	for query in redshift.get_redshift_catalogue().cache_warm_eligible_queries:
		is_eligible = eligible_queries is None or query.name in eligible_queries
		if is_eligible:
			for permutation in query.generate_cachable_parameter_permutations():
				queries.append({
					"query_name": query.name,
					"supplied_parameters": permutation
				})
	return queries


def get_concurrent_redshift_query_queue_semaphore(queue_name):
	concurrency = settings.REDSHIFT_QUERY_QUEUES[queue_name]["concurrency"]
	concurrent_redshift_query_semaphore = Semaphore(
		redshift.get_redshift_cache_redis_client(),
		count=concurrency,
		namespace=queue_name,
		stale_client_timeout=300,
		blocking=False
	)
	return concurrent_redshift_query_semaphore


def get_cluster_set_data(
	game_format=FormatType.FT_STANDARD,
	lookback=7,
	min_observations=100,
	min_pilots=10,
	block=True
):
	from hsreplaynet.utils.aws.redshift import get_redshift_query

	gt = "RANKED_STANDARD" if game_format == FormatType.FT_STANDARD else "RANKED_WILD"
	query = get_redshift_query("list_cluster_set_data")
	time_range_val = "LAST_%i_DAY" % lookback
	if lookback > 1:
		time_range_val += "S"

	parameterized_query = query.build_full_params(dict(
		TimeRange=time_range_val,
		min_games=min_observations,
		min_pilots=min_pilots,
		GameType=gt,
	))

	if not parameterized_query.result_available or parameterized_query.result_is_stale:
		if block:
			attempt_request_triggered_query_execution(parameterized_query, run_local=True)
			sleep_counter = 0
			MAX_SLEEP = 120
			while not parameterized_query.result_available:
				if sleep_counter >= MAX_SLEEP:
					raise RuntimeError(
						"Waited %i seconds, clustering data not available" % MAX_SLEEP
					)
				time.sleep(1)
				sleep_counter += 1

		else:
			attempt_request_triggered_query_execution(parameterized_query)
			return []

	return parameterized_query.response_payload


RANK_MAP = [
	"LEGEND_ONLY",
	"ONE",
	"TWO",
	"THREE",
	"FOUR",
	"FIVE",
	"SIX",
	"SEVEN",
	"EIGHT",
	"NINE",
	"TEN",
	"ELEVEN",
	"TWELVE",
	"THIRTEEN",
	"FOURTEEN",
	"FIFTEEN",
	"SIXTEEN",
	"SEVENTEEN",
	"EIGHTEEN",
	"NINETEEN",
	"TWENTY"
]


def get_meta_preview(num_items=10):
	from hsreplaynet.utils.aws.redshift import get_redshift_query

	query = get_redshift_query("archetype_popularity_distribution_stats")

	unique_archetypes = set()
	data = []

	ranks = [x for x in range(0, 21)]

	for rank in ranks:
		regions = ["REGION_EU", "REGION_US", "REGION_KR", "REGION_CN"]
		for region in regions:
			parameterized_query = query.build_full_params(dict(
				TimeRange="LAST_1_DAY",
				GameType="RANKED_STANDARD",
				RankRange=RANK_MAP[rank],
				Region=region
			))

			trigger_if_stale(parameterized_query)

			if not parameterized_query.result_available:
				continue

			response = parameterized_query.response_payload

			archetypes = []
			for class_values in response["series"]["data"].values():
				for value in class_values:
					if value["archetype_id"] > 0 and value["pct_of_total"] > 0.5:
						archetypes.append(value)
			if not len(archetypes):
				continue

			archetype = list(sorted(archetypes, key=lambda a: a["win_rate"], reverse=True))[0]
			unique_archetypes.add(archetype["archetype_id"])
			data.append({
				"rank": rank,
				"region": region,
				"data": archetype,
				"as_of": response["as_of"]
			})

	results = []
	for archetype_id in unique_archetypes:
		for datum in data:
			if datum["data"]["archetype_id"] == archetype_id:
				results.append(datum)
				break
		data.remove(datum)

	hour = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
	random = seed(int(hour.timestamp()))

	if len(results) < num_items:
		shuffle(data, random=random)
		for i in range(0, num_items - len(results)):
			results.append(data[i])

	shuffle(results, random=random)

	return results[:num_items]
