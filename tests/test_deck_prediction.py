from datetime import datetime

import fakeredis
import pytest
from hearthstone.enums import CardClass, FormatType

from hsreplaynet.utils.prediction import RedisInverseLookupTable


@pytest.fixture(scope="function")
def redis():
	redis = fakeredis.FakeStrictRedis()
	yield redis
	redis.flushall()


@pytest.fixture(scope="function")
def mock_time(mocker):
	"""This fixture mocks the current time to the provided datetime when called."""
	def inner(ts: datetime) -> None:
		mocker.patch("fakeredis.datetime", mocker.Mock(now=lambda: ts))
		mocker.patch(
			"hsreplaynet.utils.prediction.time",
			mocker.Mock(time=lambda: ts.timestamp())
		)
	return inner


def test_inverse_lookup_table_observes_complete_deck(redis):
	ilt = RedisInverseLookupTable(redis, FormatType.FT_STANDARD, CardClass.DRUID)
	ilt.observe({
		1: 2,
		2: 2,
		3: 2,
		4: 2,
		5: 2,
		6: 2,
		7: 2,
		8: 2,
		9: 2,
		10: 2,
		11: 2,
		12: 2,
		13: 2,
		14: 2,
		15: 1,
		16: 1,
	}, 1)


def test_inverse_lookup_table_does_not_observe_incomplete_deck(redis):
	ilt = RedisInverseLookupTable(redis, FormatType.FT_STANDARD, CardClass.DRUID)
	with pytest.raises(ValueError):
		ilt.observe({
			1: 2,
			2: 2,
			3: 2,
			4: 2,
			5: 2,
			6: 2,
			7: 2,
			8: 2,
			9: 2,
			10: 2,
			11: 2,
			12: 2,
			13: 2,
			14: 2,
			15: 1,
		}, 1)


def test_inverse_lookup_table_predicts_single_deck(redis):
	ilt = RedisInverseLookupTable(
		redis,
		FormatType.FT_STANDARD,
		CardClass.DRUID,
		full_deck_size=4
	)
	ilt.observe({1: 1, 2: 1, 3: 2}, 1)
	# connect to Redis through a second ILT to ensure there is no local state inside the ILT
	remote_ilt = RedisInverseLookupTable(
		redis,
		FormatType.FT_STANDARD,
		CardClass.DRUID,
		min_cards_for_prediction=1
	)
	assert remote_ilt.predict({1: 1, 3: 2}) == 1


def test_inverse_lookup_table_predicts_double_card_deck_with_single_card(redis):
	ilt = RedisInverseLookupTable(
		redis,
		FormatType.FT_STANDARD,
		CardClass.DRUID,
		full_deck_size=4
	)
	ilt.observe({1: 1, 2: 1, 3: 2}, 1)
	remote_ilt = RedisInverseLookupTable(
		redis,
		FormatType.FT_STANDARD,
		CardClass.DRUID,
		min_cards_for_prediction=1
	)
	assert remote_ilt.predict({1: 1, 2: 1, 3: 1}) == 1


def test_inverse_lookup_table_predicts_more_popular_deck(redis):
	ilt = RedisInverseLookupTable(
		redis,
		FormatType.FT_STANDARD,
		CardClass.DRUID,
		full_deck_size=4
	)
	ilt.observe({1: 1, 2: 1, 3: 2}, 1)
	ilt.observe({1: 1, 3: 2, 4: 1}, 2)
	ilt.observe({1: 1, 2: 1, 3: 2}, 1)
	remote_ilt = RedisInverseLookupTable(
		redis,
		FormatType.FT_STANDARD,
		CardClass.DRUID,
		min_cards_for_prediction=1
	)
	assert remote_ilt.predict({1: 1, 3: 2}) == 1


def test_inverse_lookup_table_predicts_fuzzy_deck(redis):
	ilt = RedisInverseLookupTable(
		redis,
		FormatType.FT_STANDARD,
		CardClass.DRUID,
		full_deck_size=4
	)
	ilt.observe({1: 1, 2: 1, 3: 2}, 1)
	remote_ilt = RedisInverseLookupTable(
		redis,
		FormatType.FT_STANDARD,
		CardClass.DRUID,
		min_cards_for_prediction=1
	)
	assert remote_ilt.predict({1: 1, 2: 1, 4: 1}) == 1


def test_inverse_lookup_table_does_not_remove_too_many_fuzzy_cards(redis):
	ilt = RedisInverseLookupTable(
		redis,
		FormatType.FT_STANDARD,
		CardClass.DRUID,
		full_deck_size=4,
	)
	ilt.observe({1: 1, 2: 1, 3: 2}, 1)
	remote_ilt = RedisInverseLookupTable(
		redis,
		FormatType.FT_STANDARD,
		CardClass.DRUID,
		min_cards_for_prediction=1,
		max_fuzzy_cards_removed=0
	)
	assert remote_ilt.predict({1: 1, 2: 1, 4: 1}) is None


def test_inverse_lookup_table_does_not_remove_required_card(redis):
	ilt = RedisInverseLookupTable(
		redis,
		FormatType.FT_STANDARD,
		CardClass.DRUID,
		full_deck_size=4
	)
	ilt.observe({1: 1, 2: 1, 3: 2}, 1)
	remote_ilt = RedisInverseLookupTable(
		redis,
		FormatType.FT_STANDARD,
		CardClass.DRUID,
		min_cards_for_prediction=1,
		required_cards={4},
	)
	assert remote_ilt.predict({1: 1, 2: 1, 4: 1}) is None


def test_inverse_lookup_table_deck_popularities_expire(redis, mock_time):
	# 8am: observe a bunch of decks with 1h expiry
	mock_time(datetime(2019, 1, 1, 8, 0))
	ilt = RedisInverseLookupTable(
		redis,
		FormatType.FT_STANDARD,
		CardClass.DRUID,
		full_deck_size=4,
		ilt_lookback_mins=240,
		deck_popularity_lookback_mins=60,
	)
	ilt.observe({1: 1, 2: 1, 3: 2}, 1)
	ilt.observe({1: 1, 2: 1, 3: 2}, 1)

	# 10am: observe a single deck
	mock_time(datetime(2019, 1, 1, 10, 0))
	ilt.observe({1: 1, 3: 2, 4: 1}, 2)

	# ensure that we have forgotten about popularity from the decks from 2hrs ago
	remote_ilt = RedisInverseLookupTable(
		redis,
		FormatType.FT_STANDARD,
		CardClass.DRUID,
		min_cards_for_prediction=1,
		ilt_lookback_mins=240,
		deck_popularity_lookback_mins=60,
	)
	assert remote_ilt.predict({1: 1, 3: 2}) == 2


def test_inverse_lookup_table_deck_popularities_expire_in_sliding_window(redis, mock_time):
	# 8am: observe deck #1 twice
	mock_time(datetime(2019, 1, 1, 8, 0))
	ilt = RedisInverseLookupTable(
		redis,
		FormatType.FT_STANDARD,
		CardClass.DRUID,
		full_deck_size=4,
		ilt_lookback_mins=240,
		deck_popularity_lookback_mins=90,
	)
	ilt.observe({1: 1, 2: 1, 3: 2}, 1)
	ilt.observe({1: 1, 2: 1, 3: 2}, 1)

	# 9am: refresh deck #1
	mock_time(datetime(2019, 1, 1, 9, 0))
	ilt.observe({1: 1, 2: 1, 3: 2}, 1)

	# 10am: ensure that deck #1 has only 1 observation remaining and deck #2 is picked
	mock_time(datetime(2019, 1, 1, 10, 0))
	ilt.observe({1: 1, 3: 2, 4: 1}, 2)
	ilt.observe({1: 1, 3: 2, 4: 1}, 2)
	remote_ilt = RedisInverseLookupTable(
		redis,
		FormatType.FT_STANDARD,
		CardClass.DRUID,
		min_cards_for_prediction=1,
		ilt_lookback_mins=240,
		deck_popularity_lookback_mins=90,
	)
	assert remote_ilt.predict({1: 1, 3: 2}) == 2


def test_inverse_lookup_table_ilts_expire(redis, mock_time):
	# 8am: Observe a deck with 1h expiry
	mock_time(datetime(2019, 1, 1, 8, 0))
	ilt = RedisInverseLookupTable(
		redis,
		FormatType.FT_STANDARD,
		CardClass.DRUID,
		full_deck_size=4,
		ilt_lookback_mins=60,
	)
	ilt.observe({1: 1, 2: 1, 3: 2}, 1)

	# 10am: Ensure we have forgotten about the deck
	mock_time(datetime(2019, 1, 1, 10, 0))
	remote_ilt = RedisInverseLookupTable(
		redis,
		FormatType.FT_STANDARD,
		CardClass.DRUID,
		min_cards_for_prediction=1,
		ilt_lookback_mins=60,
	)
	assert remote_ilt.predict({1: 1, 3: 2}) is None


def test_inverse_lookup_table_ilts_expire_in_sliding_window(redis, mock_time):
	# 8am: Observe a deck with 90m expiry twice
	mock_time(datetime(2019, 1, 1, 8, 0))
	ilt = RedisInverseLookupTable(
		redis,
		FormatType.FT_STANDARD,
		CardClass.DRUID,
		full_deck_size=4,
		ilt_lookback_mins=90,
		deck_popularity_lookback_mins=240,
	)
	# Let's observe this deck twice and keep the popularity lookback very high.
	# This ensures that if the ILTs erroneously reference this deck, it will be the result
	ilt.observe({1: 1, 2: 1, 3: 2}, 1)
	ilt.observe({1: 1, 2: 1, 3: 2}, 1)

	# 9am: Observe a similar deck to refresh the card keys' timestamp
	mock_time(datetime(2019, 1, 1, 9))
	ilt.observe({1: 1, 3: 2, 4: 1}, 2)

	# 10am: Ensure we don't have any reference to the old deck
	mock_time(datetime(2019, 1, 1, 10))
	remote_ilt = RedisInverseLookupTable(
		redis,
		FormatType.FT_STANDARD,
		CardClass.DRUID,
		min_cards_for_prediction=1,
		ilt_lookback_mins=90,
		deck_popularity_lookback_mins=240,
	)
	assert remote_ilt.predict({1: 1, 3: 2}) == 2


def test_inverse_lookup_table_does_not_predict_unknown_deck(redis):
	ilt = RedisInverseLookupTable(
		redis,
		FormatType.FT_STANDARD,
		CardClass.DRUID,
		min_cards_for_prediction=1,
		full_deck_size=4
	)
	ilt.observe({4: 2, 5: 1, 6: 1}, 1)
	assert ilt.predict({1: 1, 2: 1, 3: 2}) is None


def test_inverse_lookup_table_does_not_predict_too_few_cards(redis):
	ilt = RedisInverseLookupTable(
		redis,
		FormatType.FT_STANDARD,
		CardClass.DRUID,
		min_cards_for_prediction=3,
		full_deck_size=4
	)
	ilt.observe({1: 1, 2: 1, 3: 2}, 1)
	assert ilt.predict({1: 1}) is None


def test_inverse_lookup_table_isolates_game_format(redis):
	ilt = RedisInverseLookupTable(
		redis,
		FormatType.FT_STANDARD,
		CardClass.DRUID,
		full_deck_size=4
	)
	ilt.observe({1: 1, 2: 1, 3: 2}, 1)
	remote_ilt = RedisInverseLookupTable(
		redis,
		FormatType.FT_WILD,
		CardClass.DRUID,
		min_cards_for_prediction=1
	)
	assert remote_ilt.predict({1: 1, 3: 2}) is None


def test_inverse_lookup_table_isolates_player_class(redis):
	ilt = RedisInverseLookupTable(
		redis,
		FormatType.FT_STANDARD,
		CardClass.DRUID,
		full_deck_size=4
	)
	ilt.observe({1: 1, 2: 1, 3: 2}, 1)
	remote_ilt = RedisInverseLookupTable(
		redis,
		FormatType.FT_STANDARD,
		CardClass.SHAMAN,
		min_cards_for_prediction=1
	)
	assert remote_ilt.predict({1: 1, 3: 2}) is None


def test_inverse_lookup_table_observe_enforces_dbf_ids(redis):
	ilt = RedisInverseLookupTable(
		redis,
		FormatType.FT_STANDARD,
		CardClass.DRUID,
		full_deck_size=4
	)

	with pytest.raises(ValueError):
		ilt.observe({"GVG_006": 2, "GVG_037": 2}, 1)
