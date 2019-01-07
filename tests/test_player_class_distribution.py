from collections import defaultdict
from datetime import datetime, timedelta
from random import randrange
from unittest.mock import patch

import fakeredis
from hearthstone.enums import CardClass

from hsreplaynet.api.live.distributions import get_player_class_distribution


@patch("redis_lock.Lock")
def test_player_class_distribution(_mock_lock):
	redis = fakeredis.FakeStrictRedis()
	distribution = get_player_class_distribution("FT_STANDARD", redis)

	current_ts = datetime.utcnow()
	# t_0 is 5 minutes in the past
	t_0 = current_ts - timedelta(seconds=300, microseconds=current_ts.microsecond)

	actual_games = defaultdict(int)
	actual_wins = defaultdict(int)
	# First populate the distribution for the last 5 minutes
	t_i = None
	for i in range(301):
		t_i = t_0 + timedelta(seconds=i)
		games_per_second = randrange(3, 14)
		for game_num in range(games_per_second):
			win = bool(randrange(0, 2))
			player_class = CardClass(randrange(2, 11))
			actual_games[player_class.name] += 1
			if win:
				actual_wins[player_class.name] += 1
			distribution.increment(
				key=player_class.name,
				win=win,
				as_of=t_i
			)

	# Then validate the data distribution
	data = distribution.distribution(start_ts=t_0, end_ts=t_i)
	for i in range(2, 11):
		player_class = CardClass(i)
		assert player_class.name in data
		player_class_data = data[player_class.name]
		assert player_class_data["games"] == actual_games[player_class.name]
		assert player_class_data["wins"] == actual_wins[player_class.name]
