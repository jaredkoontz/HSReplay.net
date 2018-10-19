import pytest
from hearthstone.deckstrings import parse_deckstring
from hearthstone.enums import CardClass, FormatType

from hsreplaynet.decks.models import (
	ClassClusterSnapshot, ClusterManager, ClusterSetSnapshot, ClusterSnapshot
)


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


def _get_deck_from_deckstring(deckstring):
	cardlist, _, _ = parse_deckstring(deckstring)
	return {dbf_id: count for (dbf_id, count) in cardlist}


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
