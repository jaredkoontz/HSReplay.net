import json

import pytest
from django_hearthstone.cards.models import Card
from hearthstone.deckstrings import parse_deckstring
from hearthstone.enums import CardClass

from hsreplaynet.analytics.views import SingleClusterUpdateView
from hsreplaynet.decks.models import (
	Archetype, ClassClusterSnapshot, ClusterSetSnapshot, ClusterSnapshot
)
from hsreplaynet.features.models import Feature, FeatureStatus


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


class TestSingleClusterUpdateView:
	view = SingleClusterUpdateView()

	@pytest.fixture(autouse=True)
	def setup_method(self, db):
		Feature(name="archetype-training", status=FeatureStatus.PUBLIC).save()

		self.cluster_set = ClusterSetSnapshot()
		self.cluster_set.save()

		self.class_cluster = ClassClusterSnapshot(cluster_set=self.cluster_set)
		self.class_cluster.save()

		self.cluster = ClusterSnapshot(
			class_cluster=self.class_cluster,
			cluster_id=1,
			data_points=[{
				"x": 0,
				"y": 0,
				"cards": _get_deck_from_deckstring(
					"AAECAZICApnTAvH7Ag5AX+kB/gHTA8QGpAf2B+QIktICmNICntICv/ICj/YCAA=="
				),
				"observations": 1
			}],
			signature=MECHATHUN_DRUID
		)
		self.cluster.save()

	@pytest.mark.django_db
	def test_patch_no_archetype_id(self, client):
		response = client.patch(
			f"/analytics/clustering/data/{self.cluster_set.id}/{self.cluster.cluster_id}/",
			data="{}"
		)

		assert response.status_code == 200

		self.cluster.refresh_from_db()

		assert self.cluster.external_id is None
		assert self.cluster.name == "NEW"
		assert self.cluster.required_cards == []

	def test_patch_with_archetype_id(self, client):
		archetype = Archetype(
			name="Mecha'thun Druid",
			player_class=CardClass.DRUID,
		)
		archetype.save()
		archetype.required_cards.add(Card.objects.get(dbf_id=48625))

		response = client.patch(
			f"/analytics/clustering/data/{self.cluster_set.id}/{self.cluster.cluster_id}/",
			data=json.dumps({
				"archetype_id": archetype.id
			})
		)

		assert response.status_code == 200

		self.cluster.refresh_from_db()

		assert self.cluster.external_id == archetype.id
		assert self.cluster.name == "Mecha'thun Druid"
		assert self.cluster.required_cards == [48625]
