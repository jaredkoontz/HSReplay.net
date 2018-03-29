from datetime import datetime, timedelta
from itertools import chain

from redis import StrictRedis


SECONDS_PER_HOUR = 3600
SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR
DEFAULT_TTL = 15 * SECONDS_PER_DAY  # 15 Days


class RedisPopularityDistribution:
	INCREMENT_SCRIPT = """
		local myset = ARGV[1]
		local set_length = tonumber(ARGV[2])
		local mykey = ARGV[3]
		local exp_ts = tonumber(ARGV[4])

		if redis.call('ZRANK', myset, mykey) then
			redis.call('ZINCRBY', myset, 1.0, mykey)
		elseif redis.call('ZCARD', myset) < set_length then
			redis.call('ZADD', myset, 1.0, mykey)
		else
			local value = redis.call('ZRANGE', myset, 0, 0, 'withscores')
			redis.call('ZREM', myset, value[1])
			redis.call('ZADD', myset, value[2] + 1.0, mykey)
		end

		redis.call('EXPIREAT', myset, exp_ts)
	"""

	def __init__(
		self, redis: StrictRedis, name: str, namespace: str,
		ttl: int=DEFAULT_TTL, max_items: int=100, bucket_size: int=3600
	) -> None:
		self.redis = redis
		self.name = name
		self.namespace = namespace
		self.ttl = ttl
		self.max_items = max_items
		self.bucket_size = bucket_size

		if self.bucket_size < 1:
			raise ValueError("bucket_size must be >= 1")

		if self.bucket_size > self.ttl:
			raise ValueError("bucket_size cannot be larger than ttl")

		self.use_lua = isinstance(redis, StrictRedis)
		if self.use_lua:
			self.lua_increment = self.redis.register_script(self.INCREMENT_SCRIPT)

	def __repr__(self):
		return f"<{self.__class__.__name__} {self.namespace}:{self.name}>"

	def increment(self, key, as_of=None):
		if as_of and not isinstance(as_of, datetime):
			raise ValueError("as_of must be a datetime")

		ts = as_of if as_of else datetime.utcnow()
		start_token = self._to_start_token(ts)
		end_token = self._to_end_token(ts)

		bucket_key = self._bucket_key(start_token, end_token)
		expire_at = self._to_expire_at(ts)

		if self.use_lua:
			args = [bucket_key, self.max_items, key, expire_at]
			self.lua_increment(args=args)
		else:
			if self.redis.zrank(bucket_key, key) is not None:
				self.redis.zincrby(bucket_key, key, 1.0)
			elif self.redis.zcard(bucket_key) < self.max_items:
				self.redis.zadd(bucket_key, 1.0, key)
			else:
				vals = self.redis.zrange(bucket_key, 0, 0, withscores=True)
				self.redis.zrem(bucket_key, vals[0])
				self.redis.zadd(bucket_key, vals[1] + 1.0, key)

			self.redis.expireat(bucket_key, expire_at)

	def distribution(self, start_ts=None, end_ts=None, limit=None, as_percentages=False):
		start_ts = start_ts if start_ts else self.earliest_available_datetime
		end_ts = end_ts if end_ts else datetime.utcnow()

		if start_ts > end_ts:
			raise ValueError("start_ts cannot be greater than end_ts")

		exists = self._ensure_exists(start_ts, end_ts)
		if not exists:
			# We have no distribution data for this time period
			return {}

		start_token = self._to_start_token(start_ts)
		end_token = self._to_end_token(end_ts)
		bucket_key = self._bucket_key(start_token, end_token)
		num_items = -1 if not limit else limit
		raw_data = self.redis.zrevrange(bucket_key, 0, num_items, withscores=True)
		data = {k.decode("utf8"): int(v) for k, v in raw_data}
		if len(data) and as_percentages:
			total = sum(data.values())
			return {k: round((100.0 * v / total), 2) for k, v in data}
		else:
			return data

	def size(self, start_ts=None, end_ts=None):
		return len(self.distribution(start_ts, end_ts))

	def observations(self, start_ts=None, end_ts=None):
		return sum(self.distribution(start_ts, end_ts).values())

	def popularity(self, key, start_ts=None, end_ts=None, precision=4):
		dist = self.distribution(start_ts, end_ts)
		numerator = dist.get(str(key), 0)
		denominator = sum(dist.values())
		popularity = 100.0 * (numerator / denominator)
		return round(popularity, precision)

	def _ensure_exists(self, start_ts, end_ts):
		start_token = self._to_start_token(start_ts)
		end_token = self._to_end_token(end_ts)
		summary_key = self._bucket_key(start_token, end_token)
		summary_exists = self.redis.exists(summary_key)

		if self._next_token(start_token) > end_token:
			# We are dealing with the a single time bucket
			return summary_exists

		includes_current_bucket = end_token > self._current_start_token
		if not summary_exists or includes_current_bucket:
			# We either need to build or refresh the summary
			buckets = []
			oldest_bucket_ttl = None
			tokens_between = self._generate_bucket_tokens_between(start_token, end_token)
			for s, e in tokens_between:
				bucket_key = self._bucket_key(s, e)
				if self.redis.exists(bucket_key):
					buckets.append(bucket_key)
					if not oldest_bucket_ttl:
						oldest_bucket_ttl = self.redis.ttl(bucket_key)

			if buckets:
				self.redis.zunionstore(summary_key, buckets)

				# The summary table inherits the TTL of its oldest bucket
				self.redis.expire(summary_key, oldest_bucket_ttl)
				return True
			else:
				# This is an error state
				return False
		else:
			# The summary already exists and does not include the current bucket
			return True

	def _generate_bucket_tokens_between(self, start_token, end_token):
		result = []
		next_start_token = self._next_token(start_token)
		while next_start_token <= (end_token + 1):
			result.append((start_token, self._convert_to_end_token(start_token)))
			start_token = next_start_token
			next_start_token = self._next_token(start_token)
		return result

	def _bucket_key(self, start_token, end_token):
		return "%s:%s:%s:%s" % (self.namespace, self.name, start_token, end_token)

	def _convert_to_end_token(self, start_token, units=None):
		next_token = self._next_token(start_token, units)
		return next_token - 1

	def _next_token(self, base_token, bucket_size=None):
		effective_bucket_size = bucket_size or self.bucket_size
		return base_token + effective_bucket_size

	def _to_expire_at(self, ts):
		return self._to_end_token(ts) + self.ttl

	def _to_start_token(self, ts, bucket_size=None):
		effective_bucket_size = bucket_size or self.bucket_size
		return effective_bucket_size * int(ts.timestamp() / effective_bucket_size)

	def _to_end_token(self, ts, bucket_size=None):
		effective_bucket_size = bucket_size or self.bucket_size
		ceiling = effective_bucket_size * (int(ts.timestamp() / effective_bucket_size) + 1)
		return ceiling - 1

	@property
	def _current_start_token(self):
		return self._to_start_token(datetime.utcnow())

	@property
	def earliest_available_datetime(self):
		return datetime.utcnow() - timedelta(seconds=self.ttl)

	@property
	def latest_non_current_datetime(self):
		return self._current_start_token - 1


class RedisIntegerMapStorage:
	"""Redis storage for {Integer:Integer} maps, e.g. {DBF:COUNT}"""
	# This native Lua implementation can brute force search: ~ 25 keys / ms
	# In order to always return within 100ms we should never search more than 2,000 keys
	MATCH_SCRIPT = """
		-- Return the first deck_id in KEYS that is a superset of ARGV
		-- Return -1 if nothing matches

		local get_default = function (tab, element, default)

			for k, v in pairs(tab) do
				if k == element then
					return v
				end
			end

			return default
		end

		local to_map = function (members)
			local result = {}
			local nextkey

			for i, v in ipairs(members) do
				if i % 2 == 1 then
					nextkey = tostring(v)
				else
					result[nextkey] = tonumber(v)
				end
			end

			return result
		end

		local namespace = table.remove(ARGV, 1)
		local partial = to_map(ARGV)

		local final_result = {}

		for i, key in ipairs(KEYS) do
			local candidate_key = namespace .. ":" .. key
			local candidate = to_map(redis.call('HGETALL', candidate_key))
			local match = true

			for k, v in pairs(partial) do
				if v > get_default(candidate, k, 0) then
					match = false
				end
			end

			if match == true then
				final_result[#final_result+1]=key
			end
		end

		return final_result
	"""

	def __init__(self, caches, namespace, ttl=DEFAULT_TTL, max_match_size=1000):
		self.redis_primary, self.redis_replica = caches
		self.namespace = namespace
		self.ttl = ttl
		self.max_match_size = max_match_size
		self.use_lua = isinstance(self.redis_primary, StrictRedis)
		if self.use_lua:
			self.lua_match = self.redis_replica.register_script(self.MATCH_SCRIPT)

	def namespaced_key(self, key):
		return "%s:%s" % (self.namespace, key)

	def store(self, key, val):
		self.redis_primary.hmset(self.namespaced_key(key), val)
		self.redis_primary.expire(self.namespaced_key(key), self.ttl)

	def retrieve(self, key):
		data = self.redis_replica.hgetall(self.namespaced_key(key))
		return {int(k): int(v) for k, v in data.items()}

	def match(self, subset, *keys):
		"""Return the first member of *keys that contains the subset argument or -1."""
		if not keys:
			return []

		if len(keys) > self.max_match_size:
			msg = "Cannot call match(...) on more than %i keys"
			raise ValueError(msg % self.max_match_size)

		if self.use_lua:
			full_args = [self.namespace]
			full_args.extend(chain.from_iterable(subset.items()))
			return [k.decode("utf8") for k in self.lua_match(keys=keys, args=full_args)]
		else:
			final_result = []
			for key in keys:
				candidate = self.retrieve(key)
				if all(v <= int(candidate.get(k, 0)) for k, v in subset.items()):
					final_result.append(str(key))
			return final_result


class RedisTreeNode:
	"""A Key:Value store that represents a node in a tree."""
	def __init__(self, redis, tree, parent, label, depth, namespace="NODE", ttl=DEFAULT_TTL):
		self.redis = redis
		self.tree = tree
		self.parent = parent
		self.label = label
		self.depth = depth
		self.namespace = namespace
		self.ttl = ttl
		self.fully_qualified_label = self._make_fully_qualified_label()
		self.key = self._make_key()
		self.children_key = "%s:CHILDREN" % self.key

	def __str__(self):
		return self.key

	def __repr__(self):
		return self.key

	def _make_fully_qualified_label(self):
		if self.parent:
			return "%s->%s" % (self.parent.fully_qualified_label, self.label)
		else:
			return self.label

	def _make_key(self):
		return "%s:%s:%s" % (self.tree.key, self.namespace, self.fully_qualified_label)

	def children(self):
		for member in self.redis.smembers(self.children_key):
			yield RedisTreeNode(
				self.redis,
				self.tree,
				self,
				member,
				self.depth + 1,
				self.namespace,
				self.ttl
			)

	def get_child(self, label, create=False):
		if self.redis.sismember(self.children_key, label):
			return RedisTreeNode(
				self.redis,
				self.tree,
				self,
				label,
				self.depth + 1,
				self.namespace,
				self.ttl
			)
		elif create:
			self.redis.sadd(self.children_key, label)
			self.redis.expire(self.children_key, self.ttl)
			return RedisTreeNode(
				self.redis,
				self.tree,
				self,
				label,
				self.depth + 1,
				self.namespace,
				self.ttl
			)
		else:
			return None

	def get(self, key):
		return self.redis.hget(self.key, key).decode("utf8")

	def set(self, key, value):
		self.redis.hset(self.key, key, value)
		self.redis.expire(self.key, self.ttl)


class RedisTree:
	def __init__(self, redis, name, namespace="TREE", ttl=DEFAULT_TTL):
		self.redis = redis
		self.name = name
		self.namespace = namespace
		self.ttl = ttl
		self.key = "%s:%s" % (self.namespace, self.name)
		self.root = RedisTreeNode(redis, self, None, "ROOT", 0, ttl=self.ttl)

	def __str__(self):
		return self.key

	def __repr__(self):
		return self.key


class CappedDataFeed:
	def __init__(self, redis, name, max_items, period, comparator, ttl=DEFAULT_TTL):
		self.redis = redis
		self.name = name
		self.namespace = "CAPPED_DATA_FEED"
		self.key = "%s:%s" % (self.namespace, self.name)
		self.max_items = max_items
		self.period = period
		self.last_added_key = "%s:LAST_ADDED" % self.key
		self.comparator = comparator
		self.ttl = ttl

	def __str__(self):
		return self.key

	def __repr__(self):
		return self.key

	def push(self, data):
		if "id" not in data:
			raise RuntimeError("Data must contain 'id' key")

		def internal_push(pipe):
			last_id = pipe.lrange(self.key, -1, -1)
			last_data = pipe.hgetall(last_id[0]) if last_id else None

			cancel = (
				last_data and
				self.comparator and
				self.comparator(data, last_data) or
				not self._period_elapsed(pipe)
			)

			pipe.multi()

			if cancel:
				return False

			# add new item
			data_key = "%s:OBJ:%s" % (self.key, data["id"])
			pipe.hmset(data_key, data)
			pipe.expire(data_key, self.ttl)
			pipe.lpush(self.key, data_key)

			# trim list
			to_delete = self.redis.lrange(self.key, self.max_items - 1, -1)
			pipe.ltrim(self.key, 0, self.max_items - 1)
			if to_delete:
				pipe.delete(*to_delete)

			# update last added timestamp
			pipe.set(self.last_added_key, datetime.utcnow().timestamp())

			return True

		return self.redis.transaction(
			internal_push,
			self.last_added_key,
			value_from_callable=True
		)

	def get(self):
		keys = self.redis.lrange(self.key, 0, self.max_items)
		keys.reverse()
		pipeline = self.redis.pipeline(transaction=True)
		for key in keys:
			pipeline.hgetall(key)
		return pipeline.execute()

	def _period_elapsed(self, pipe):
		if not self.period:
			return True
		val = pipe.get(self.last_added_key)
		if val:
			return float(val) + self.period < datetime.utcnow().timestamp()
		return True
