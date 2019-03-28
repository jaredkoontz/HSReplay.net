import time
from typing import Dict, Iterable, List, Optional, Set
from uuid import uuid4

from django.conf import settings
from hearthstone.enums import CardClass, FormatType
from redis import StrictRedis

from hsreplaynet.decks.models import ClusterSnapshot


class BaseInverseLookupTable:
	"""
	This class specificies the API for an Inverse Lookup Table (ILT) to be used for
	deck prediction.
	"""

	def observe(
		self, dbf_map: Dict[int, int], deck_id: int, uuid: Optional[str] = None
	) -> None:
		"""
		This method takes a list of cards as a dict of {card_id: count} items and stores an
		entry pointing to the deck_id for each of the cards. You may optionally pass a UUID
		(such as a replay shortid) in order to deduplicate observations.
		"""
		raise NotImplementedError

	def predict(self, dbf_map: Dict[int, int]) -> Optional[int]:
		"""
		This method takes a list of cards as a dict of {card_id: count} items and attempts
		to find the most likely deck_id. If none is found, this method will return None.
		"""
		raise NotImplementedError


class RedisInverseLookupTable(BaseInverseLookupTable):
	def __init__(
		self,
		redis: StrictRedis,
		game_format: FormatType,
		player_class: CardClass,
		required_cards: Optional[Set[int]] = None,
		min_cards_for_prediction: int = settings.ILT_DECK_PREDICTION_MINIMUM_CARDS,
		ilt_lookback_mins: int = settings.ILT_LOOKBACK_MINS,
		deck_popularity_lookback_mins: int = settings.ILT_DECK_POPULARITY_LOOKBACK_MINS,
		max_fuzzy_cards_removed: int = settings.ILT_FUZZY_MAXIMUM_CARDS_REMOVED,
		full_deck_size: int = 30,
	) -> None:
		self.redis = redis
		self.game_format = game_format
		self.player_class = player_class
		self.required_cards = required_cards or set()
		self.ilt_lookback_mins = ilt_lookback_mins
		self.deck_popularity_lookback_mins = deck_popularity_lookback_mins
		self.min_cards_for_prediction = min_cards_for_prediction
		self.max_fuzzy_cards_removed = max_fuzzy_cards_removed
		self.full_deck_size = full_deck_size

	@property
	def namespace(self):
		return f"DECK_PREDICTION_ILT:{self.game_format.name}_{self.player_class.name}"

	def observe(
		self, dbf_map: Dict[int, int], deck_id: int, uuid: Optional[str] = None
	) -> None:
		if not self._is_full_deck(dbf_map):
			raise ValueError("The deck is not a full deck")

		# calculate times
		now_msecs = int(time.time() * 1000)
		lookback_msecs = self.deck_popularity_lookback_mins * 60 * 1000

		# pipeline all the following commands
		pipeline = self.redis.pipeline()

		# observe the cards in ILTs
		for key in self._get_card_keys(dbf_map):
			pipeline.zadd(key, now_msecs, deck_id)
			pipeline.expire(key, self.ilt_lookback_mins * 60)

		# observe the deck for popularity
		deck_key = self._get_deck_key(deck_id)
		uuid = uuid or str(uuid4())
		pipeline.zadd(deck_key, now_msecs, uuid)
		pipeline.zremrangebyscore(deck_key, 0, now_msecs - lookback_msecs)
		pipeline.expire(deck_key, self.deck_popularity_lookback_mins * 60)

		# send the pipeline over the wire
		pipeline.execute()

	def _is_full_deck(self, dbf_map: Dict[int, int]) -> bool:
		return sum(count for card_id, count in dbf_map.items()) == self.full_deck_size

	def _get_card_keys(self, dbf_map: Dict[int, int]) -> Set[str]:
		keys = set()
		for card_id, count in dbf_map.items():
			# Also return all permutations with fewer cards, as if a card is in a deck twice
			# we also want to be able to predict the deck if we only observe it once.
			for i in range(1, count + 1):
				keys.add(self._get_card_key(card_id, i))
		return keys

	def _get_card_key(self, card_id: int, count: int = 1) -> str:
		if not isinstance(card_id, int):
			raise ValueError("Expected dbf id as card id")
		return f"{self.namespace}:ILT:{int(card_id)}:x{int(count)}"

	def _get_deck_key(self, deck_id: int) -> str:
		return f"{self.namespace}:POPULARITY:{deck_id}"

	def predict(self, dbf_map: Dict[int, int]) -> Optional[int]:
		# store some debugging data
		self._cards_removed = None

		# check to see whether enough the deck to predict has enough cards
		if not self._is_predictable_deck(dbf_map):
			return None

		# get the associated redis keys
		keys = self._get_card_keys(dbf_map)

		# check for expiry first
		now_msecs = int(time.time() * 1000)
		lookback_msecs = self.ilt_lookback_mins * 60 * 1000
		pipeline = self.redis.pipeline()
		for key in keys:
			pipeline.zremrangebyscore(key, 0, now_msecs - lookback_msecs)
		pipeline.execute()

		# trivial case: find the decks from a intersection over all cards
		candidates = self._zinter(keys)
		if len(candidates):
			deck_ids = map(lambda deck_id: int(deck_id.decode("utf-8")), candidates)
			return max(deck_ids, key=lambda deck_id: self._get_popularity_for_deck(deck_id))

		# count number of decks for each card once before fuzzy matching
		pipeline = self.redis.pipeline()
		key_list = list(keys)
		for key in key_list:
			pipeline.zcard(key)
		cardinalities = {key_list[index]: card for index, card in enumerate(pipeline.execute())}
		sorted_keys = sorted(keys, key=lambda key: cardinalities[key])
		required_keys = self._get_card_keys({key: 1 for key in self.required_cards})

		# fuzzy matching: as long as we can safely remove one card...
		self._cards_removed = 0
		while (
			len(sorted_keys) > self.min_cards_for_prediction and
			self._cards_removed < self.max_fuzzy_cards_removed
		):
			# ...find a non-required card to remove
			for index, key_to_remove in enumerate(sorted_keys):
				if key_to_remove not in required_keys:
					del sorted_keys[index]
					self._cards_removed += 1
					break
			else:
				# we were unable to remove anything, terminate
				return None
			# ...calculate our new candidates
			candidates = self._zinter(sorted_keys)
			# ...and finally check whether we got a match
			if len(candidates) > 0:
				deck_ids = map(lambda deck_id: int(deck_id.decode("utf-8")), candidates)
				return max(deck_ids, key=lambda deck_id: self._get_popularity_for_deck(deck_id))

		# we were unable to match a deck
		return None

	def _zinter(self, keys: Iterable[str]) -> List[str]:
		tmp_key = f"{self.namespace}:INTERSECT:{uuid4()}"
		pipeline = self.redis.pipeline()
		pipeline.zinterstore(tmp_key, keys=keys)
		pipeline.zrange(tmp_key, 0, -1)
		pipeline.delete(tmp_key)
		results = pipeline.execute()
		return results[1]

	def _is_predictable_deck(self, dbf_map: Dict[int, int]) -> bool:
		num_cards = 0
		for card_id, count in dbf_map.items():
			num_cards = num_cards + count
			if num_cards >= self.min_cards_for_prediction:
				# we've seen enough, terminate early
				return True
		else:
			# if the loop exits normally we haven't seen enough cards
			return False

	def _get_popularity_for_deck(self, deck_id: int) -> int:
		key = self._get_deck_key(deck_id)
		now_msecs = int(time.time() * 1000)
		lookback_msecs = self.deck_popularity_lookback_mins * 60 * 1000
		# count all remaining observations
		return self.redis.zcount(key, now_msecs - lookback_msecs, "+inf")


def inverse_lookup_table(
	game_format: FormatType, player_class: CardClass, redis_client=None
) -> BaseInverseLookupTable:
	if not redis_client:
		from django.core.cache import caches
		redis_client = caches["ilt_deck_prediction"].client.get_client()

	game_format = FormatType(int(game_format))
	player_class = CardClass(int(player_class))

	required_cards = ClusterSnapshot.objects.get_required_cards_for_player_class(
		game_format, player_class
	)

	return RedisInverseLookupTable(redis_client, game_format, player_class, required_cards)
