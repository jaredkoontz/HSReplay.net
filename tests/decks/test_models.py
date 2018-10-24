from unittest.mock import patch, call

import pytest
from django_hearthstone.cards.models import Card
from hearthstone.enums import CardClass, FormatType

from hsreplaynet.decks.models import (
	Archetype, ClassClusterSnapshot, ClusterManager, ClusterSetSnapshot, ClusterSnapshot
)
from tests.utils import create_deck_from_deckstring

MECHATHUN_DRUID = {
	"64": 0.9740336446962571,
	"95": 1.0,
	"233": 1.0,
	"254": 0.9961498917157044,
	"836": 1.0,
	"1124": 1.0,
	"43288": 1.0,
	"43294": 0.9991030997746811,
	"43417": 0.9334762540196443,
	"47423": 0.9981405727036073,
	"48625": 0.9986655874696476,
}


class TestClusterManager:

	@pytest.mark.django_db()
	def test_get_signature_weights(self):
		self.cluster_set = ClusterSetSnapshot(
			game_format=FormatType.FT_STANDARD,
			live_in_production=True
		)
		self.cluster_set.save()

		self.class_cluster = ClassClusterSnapshot(
			cluster_set=self.cluster_set,
			player_class=CardClass.DRUID
		)
		self.class_cluster.save()

		self.cluster = ClusterSnapshot(
			class_cluster=self.class_cluster,
			cluster_id=1,
			external_id=247,
			required_cards=[48625],
			ccp_signature=MECHATHUN_DRUID
		)
		self.cluster.save()

		signature_weights = ClusterManager().get_signature_weights(
			FormatType.FT_STANDARD,
			CardClass.DRUID
		)

		assert signature_weights == {
			247: {
				"required_cards": [48625],
				"rules": [],
				"signature_weights": {int(k): v for k, v in MECHATHUN_DRUID.items()}
			}
		}


class TestClusterSetSnapshot:

	@pytest.mark.django_db
	def test_synchronize_deck_archetype_assignments_update_required_cards(self):
		archetype = Archetype(
			name="Mecha'thun Druid",
			player_class=CardClass.DRUID,
		)
		archetype.save()
		archetype.required_cards.add(Card.objects.get(dbf_id=836))
		archetype.required_cards.add(Card.objects.get(dbf_id=1124))

		cluster_set = ClusterSetSnapshot(
			game_format=FormatType.FT_STANDARD,
			live_in_production=True
		)
		cluster_set.save()

		class_cluster = ClassClusterSnapshot(
			cluster_set=cluster_set,
			player_class=CardClass.DRUID
		)
		class_cluster.save()

		cluster = ClusterSnapshot(
			class_cluster=class_cluster,
			cluster_id=1,
			external_id=archetype.id,
			required_cards=[48625],
			ccp_signature=MECHATHUN_DRUID
		)
		cluster.save()

		cluster_set.synchronize_deck_archetype_assignments()

		assert archetype.required_cards.count() == 1
		assert archetype.required_cards.first() == Card.objects.get(dbf_id=48625)


class TestDeck:

	@pytest.mark.django_db
	@patch("hsreplaynet.decks.models.ClusterSnapshot")
	def test_classify_into_archetype(self, _):
		deck = create_deck_from_deckstring(
			"AAECAZICApnTAvH7Ag5AX+kB/gHTA8QGpAf2B+QIktICmNICntICv/ICj/YCAA=="
		)

		classification_failure_stubs = [
			{"archetype_id": 123, "reason": "bad_deck"},
			{"archetype_id": 124, "reason": "bad_deck"},
			{"archetype_id": 124, "reason": "too_many_firebats"}
		]

		def mock_classifier(_dbf_map, _signature_weights, failure_callback=None):
			if failure_callback:
				for stub in classification_failure_stubs:
					failure_callback(stub)

		with patch("hsreplaynet.decks.models.classify_deck", mock_classifier):
			with patch("hsreplaynet.decks.models.influx_metric") as mock_influx_client:
				deck.classify_into_archetype(CardClass.DRUID)
				mock_influx_client.assert_has_calls([
					call(
						"archetype_classification_blocked",
						{"count": 2},
						reason="bad_deck"
					),
					call(
						"archetype_classification_blocked",
						{"count": 1},
						reason="too_many_firebats"
					)
				])
