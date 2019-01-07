import json
from datetime import datetime, timedelta
from itertools import chain

import redis_lock
from redis import StrictRedis


SECONDS_PER_MINUTE = 60
SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE
SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR
DEFAULT_TTL = 15 * SECONDS_PER_DAY  # 15 Days


class RedisNamespace:
	def __init__(self, redis, name, namespace, ttl=DEFAULT_TTL):
		self.redis = redis
		self.name = name
		self.namespace = namespace
		self.key = "%s:%s" % (self.namespace, self.name)
		self.ttl = ttl

	def __str__(self):
		return self.key

	def __repr__(self):
		return self.key


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
		ttl: int = DEFAULT_TTL, max_items: int = 100, bucket_size: int = 3600,
		use_lua: bool = None
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

		# If the caller specified a preference about using Lua, respect it; otherwise,
		# use Lua if it seems like we're running in production, don't use it if it seems
		# like we're running a test.

		self.use_lua = isinstance(redis, StrictRedis) if use_lua is None else use_lua

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
			lock_name = "%s/%s" % (self.namespace, self.name)
			with redis_lock.Lock(self.redis, lock_name, expire=300):
				if self.redis.zrank(bucket_key, key) is not None:
					self.redis.zincrby(bucket_key, key, 1.0)
				elif self.redis.zcard(bucket_key) < self.max_items:
					self.redis.zadd(bucket_key, 1.0, key)
				else:
					vals = self.redis.zrange(bucket_key, 0, 0, withscores=True)
					value, score = vals[0]
					self.redis.zrem(bucket_key, value)
					self.redis.zadd(bucket_key, score + 1.0, key)

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
			tokens_between = self._generate_bucket_tokens_between(start_token, end_token)
			buckets = [self._bucket_key(s, e) for s, e in tokens_between]

			if buckets:
				self.redis.zunionstore(summary_key, buckets)
				self.redis.expire(summary_key, self.ttl)
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
				member.decode("utf8"),
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


class CappedDataFeed(RedisNamespace):
	def __init__(self, redis, name, max_items, period, comparator, fast_backfill=False):
		super().__init__(redis, name, "CAPPED_DATA_FEED")
		self.max_items = max_items
		self.period = period
		self.last_added_key = "%s:LAST_ADDED" % self.key
		self.comparator = comparator
		self.fast_backfill = fast_backfill

	def push(self, data):
		if "id" not in data:
			raise RuntimeError("Data must contain 'id' key")

		def internal_push(pipe):
			last_id = pipe.lrange(self.key, 0, 0)
			last_data = pipe.hgetall(last_id[0]) if last_id else None

			cancel = (
				last_data and
				self.comparator and
				self.comparator(data, self._decode_item(last_data)) or
				not self._period_elapsed(pipe)
			)

			pipe.multi()

			if cancel and (
				not self.fast_backfill or self._is_full()
			):
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

	def get(self, count=100):
		keys = self.redis.lrange(self.key, 0, min(count, self.max_items))
		keys.reverse()
		pipeline = self.redis.pipeline(transaction=True)
		for key in keys:
			pipeline.hgetall(key)
		items = pipeline.execute()
		return [self._decode_item(item) for item in items]

	def _decode_item(self, data):
		return {k.decode("utf8"): v.decode("utf8") for k, v in data.items()}

	def _period_elapsed(self, pipe):
		if not self.period:
			return True
		val = pipe.get(self.last_added_key)
		if val:
			return float(val) + self.period < datetime.utcnow().timestamp()
		return True

	def _is_full(self):
		return self.redis.llen(self.key) >= self.max_items


class RedisBucket(RedisNamespace):
	def __init__(self, redis, name, namespace, bucket_size, ttl):
		if bucket_size <= 0:
			raise RuntimeError("Bucket size must be larger than 0")
		if ttl <= 0:
			raise RuntimeError("TTL must be longer than 0")
		if ttl < bucket_size:
			raise RuntimeError("TTL must be longer than the bucket size")
		if bucket_size > SECONDS_PER_DAY:
			raise RuntimeError("Buckets larger than one day are not yet supported")
		if bucket_size > SECONDS_PER_HOUR:
			if SECONDS_PER_DAY % bucket_size != 0:
				raise RuntimeError("Bucket size must fit into 24 hours without remainder")
		elif bucket_size > SECONDS_PER_MINUTE:
			if SECONDS_PER_HOUR % bucket_size != 0:
				raise RuntimeError("Bucket size must fit into 60 minutes without remainder")
		elif bucket_size < SECONDS_PER_MINUTE:
			if SECONDS_PER_MINUTE % bucket_size != 0:
				raise RuntimeError("Bucket size must fit into 60 seconds without remainder")
		super().__init__(redis, name, namespace, ttl)
		self.bucket_size = bucket_size

	def _get_start_token(self, bucket_index):
		current_time = datetime.utcnow()
		hours = current_time.hour % 24 if self.bucket_size > SECONDS_PER_HOUR else 0
		minutes = current_time.minute % 60 if self.bucket_size > SECONDS_PER_MINUTE else 0
		seconds = current_time.second % 60
		current_bucket = current_time - timedelta(
			hours=hours,
			minutes=minutes,
			seconds=seconds,
			microseconds=current_time.microsecond
		)
		return int(current_bucket.timestamp()) - bucket_index * self.bucket_size

	def _bucket_key(self, start_index, count=1):
		start_token = self._get_start_token(start_index)
		end_token = start_token + self.bucket_size * count
		return "%s:%s:%s" % (self.key, start_token, end_token)


class RedisCounter(RedisBucket):
	def __init__(self, redis, name, bucket_size, ttl):
		super().__init__(redis, name, "COUNTER", bucket_size, ttl)

	def increment(self):
		key = self._bucket_key(0)

		def internal_increment(pipe):
			value = pipe.get(key) or 0
			pipe.multi()
			pipe.set(key, int(value) + 1)
			pipe.expire(key, self.ttl)
		self.redis.transaction(internal_increment, key)

	def get_count(self, start_bucket, end_bucket):
		pipe = self.redis.pipeline()
		for bucket in range(start_bucket, end_bucket + 1):
			key = self._bucket_key(bucket)
			pipe.get(key)
		raw_values = pipe.execute()
		values = [int(value) for value in raw_values if value]
		return sum(values)


class RedisSet(RedisBucket):
	def __init__(self, redis, name, bucket_size, ttl):
		super().__init__(redis, name, "SET", bucket_size, ttl)

	def add(self, value):
		key = self._bucket_key(0)
		pipe = self.redis.pipeline()
		pipe.multi()
		pipe.sadd(key, value)
		pipe.expire(key, self.ttl)
		pipe.execute()

	def get_count(self, start_bucket, end_bucket):
		if start_bucket == end_bucket:
			key = self._bucket_key(start_bucket)
			return self.redis.scard(key)

		keys = [self._bucket_key(bucket) for bucket in range(start_bucket, end_bucket + 1)]
		temp_key = "%s:TEMP" % self._bucket_key(start_bucket, end_bucket - start_bucket + 1)

		if start_bucket == 0:
			def internal_get(pipe):
				pipe.multi()
				pipe.sunionstore(temp_key, keys)
				pipe.delete(temp_key)
			return self.redis.transaction(internal_get, temp_key)[0]
		elif self.redis.exists(temp_key):
			return self.redis.scard(temp_key)
		else:
			pipe = self.redis.pipeline()
			pipe.multi()
			pipe.sunionstore(temp_key, keys)
			pipe.expire(temp_key, self.ttl)
			return pipe.execute()[0]


class RedisProxy(RedisNamespace):
	def __init__(self, redis, name, ttl, fetch):
		super().__init__(redis, name, "PROXY", ttl)
		self.fetch = fetch

	def get(self, keys):
		values = self._get(keys)
		data, missing = self._parse(keys, values)
		if missing:
			result = self.fetch(missing)
			new_data = dict()
			if result:
				for x in result:
					new_data[x["key"]] = x["value"]
			for key in missing:
				if key not in new_data:
					new_data[key] = dict()
			data.update(new_data)
			self._set(new_data)
		return data

	def _get(self, keys):
		pipe = self.redis.pipeline()
		pipe.multi()
		for key in keys:
			pipe.get(self._get_key(key))
		return pipe.execute()

	def _parse(self, keys, values):
		data = dict()
		missing = []
		for i in range(0, len(keys)):
			if values[i]:
				data[keys[i]] = json.loads(values[i])
			else:
				missing.append(keys[i])
		return data, missing

	def _set(self, new_data):
		pipe = self.redis.pipeline()
		pipe.multi()
		for key, value in new_data.items():
			redis_key = self._get_key(key)
			pipe.set(redis_key, json.dumps(value))
			pipe.expire(redis_key, self.ttl)
		pipe.execute()

	def _get_key(self, key):
		return "%s:%s" % (self.key, key)
