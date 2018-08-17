import pytest
from hearthstone.enums import CardClass

from hsreplaynet.decks.models import Archetype, Deck


HERO_CARD_ID = "HERO_05"

DECK_LIST = [
	"EX1_534",
	"EX1_534",
	"DS1_070",
	"DS1_070",
	"DS1_178",
	"DS1_178",
	"EX1_538",
	"EX1_538",
	"KAR_005",
	"KAR_005",
	"NEW1_031",
	"NEW1_031",
	"EX1_539",
	"EX1_539",
	"OG_179",
	"OG_179",
	"EX1_536",
	"EX1_536",
	"UNG_915",
	"UNG_915",
	"CFM_315",
	"CFM_315",
	"CS2_084",
	"CS2_084",
	"UNG_912",
	"UNG_912",
	"EX1_531",
	"EX1_531",
	"UNG_801",
	"UNG_801",
]


@pytest.mark.django_db
def test_deck_creation(mocker, settings):
	mocker.patch("hsreplaynet.decks.models.Deck.sync_archetype_to_firehose")
	beast_hunter = Archetype.objects.create(name="Beast Hunter")
	settings.ARCHETYPE_CLASSIFICATION_ENABLED = False

	deck, created = Deck.objects.get_or_create_from_id_list(
		DECK_LIST,
		hero_id=HERO_CARD_ID,
	)
	assert created
	assert deck.archetype is None
	assert deck.deck_class == CardClass.HUNTER

	assert deck.sync_archetype_to_firehose.call_count == 0, \
		"The initial Archetype should not be synced to Firehose via signal"

	deck.archetype = beast_hunter
	deck.save()

	assert deck.sync_archetype_to_firehose.call_count == 1, \
		"The new archetype was not synced to Firehose"


@pytest.mark.django_db
def test_deck_deck_class():
	HUNTER_CARD = "EX1_534"
	WARLOCK_CARD = "NEW1_003"
	NEUTRAL_CARD = "CS2_231"

	deck, _ = Deck.objects.get_or_create_from_id_list([HUNTER_CARD, HUNTER_CARD])
	assert deck.deck_class == CardClass.HUNTER

	deck, _ = Deck.objects.get_or_create_from_id_list([HUNTER_CARD, NEUTRAL_CARD])
	assert deck.deck_class == CardClass.HUNTER

	deck, _ = Deck.objects.get_or_create_from_id_list([HUNTER_CARD, WARLOCK_CARD])
	assert deck.deck_class == CardClass.INVALID

	deck, _ = Deck.objects.get_or_create_from_id_list([NEUTRAL_CARD, NEUTRAL_CARD])
	assert deck.deck_class == CardClass.NEUTRAL
