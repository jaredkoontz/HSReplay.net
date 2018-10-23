import json

import pytest
from django_hearthstone.cards.models import Card
from hearthstone.deckstrings import parse_deckstring
from hearthstone.enums import CardClass

from hsreplaynet.decks.models import (
	Archetype, ClassClusterSnapshot, ClusterSetSnapshot, ClusterSnapshot
)
from hsreplaynet.decks.views import (
	ClusterSnapshotRequiredCardsUpdateView, ClusterSnapshotUpdateView
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


MECHATHUN_QUEST_PRIEST = {
	"138": 0.9531813781571769,
	"251": 1.0,
	"613": 0.7045674557775236,
	"749": 0.973422511660653,
	"41169": 1.0,
	"41494": 1.0,
	"41885": 0.983895098125495,
	"42782": 0.98926339875033,
	"42992": 0.994631699375165,
	"43112": 1.0,
	"45353": 0.9965678077972366,
	"45930": 0.9859192114758426,
	"47836": 0.98926339875033,
	"48625": 1.0,
	"48929": 1.0,
	"49416": 0.98926339875033
}


def _get_deck_from_deckstring(deckstring):
	cardlist, _, _ = parse_deckstring(deckstring)
	return {dbf_id: count for (dbf_id, count) in cardlist}


class TestClusterSnapshotUpdateView:
	view = ClusterSnapshotUpdateView()

	@pytest.fixture(autouse=True)
	def setup_method(self, db):
		self.cluster_set = ClusterSetSnapshot(latest=True)
		self.cluster_set.save()

		self.class_cluster = ClassClusterSnapshot(
			cluster_set=self.cluster_set,
			player_class=CardClass.DRUID
		)
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
			f"/clusters/latest/FT_STANDARD/DRUID/{self.cluster.cluster_id}/",
			data="{}"
		)

		assert response.status_code == 200

		self.cluster.refresh_from_db()

		assert self.cluster.external_id is None
		assert self.cluster.name == "NEW"
		assert self.cluster.required_cards == []

	@pytest.mark.django_db
	def test_patch_with_archetype_id(self, client):
		archetype = Archetype(
			name="Mecha'thun Druid",
			player_class=CardClass.DRUID,
		)
		archetype.save()
		archetype.required_cards.add(Card.objects.get(dbf_id=48625))

		response = client.patch(
			f"/clusters/latest/FT_STANDARD/DRUID/{self.cluster.cluster_id}/",
			data=json.dumps({
				"archetype_id": archetype.id
			})
		)

		assert response.status_code == 200

		self.cluster.refresh_from_db()

		assert self.cluster.external_id == archetype.id
		assert self.cluster.name == "Mecha'thun Druid"
		assert self.cluster.required_cards == [48625]

	@pytest.mark.django_db
	def test_patch_with_archetype_id_merge(self, client):
		archetype = Archetype(
			name="Mecha'thun Druid",
			player_class=CardClass.DRUID,
		)
		archetype.save()
		archetype.required_cards.add(Card.objects.get(dbf_id=48625))

		existing_cluster = ClusterSnapshot(
			class_cluster=self.class_cluster,
			cluster_id=2,
			data_points=[{
				"x": 0,
				"y": 0,
				"cards": _get_deck_from_deckstring(
					"AAECAZICBFaHzgKZ0wLx+wINQF/pAf4BxAbkCKDNApTSApjSAp7SAtvTAoTmAr/yAgA="
				),
				"observations": 1
			}],
			external_id=archetype.id,
			name=archetype.name,
			required_cards=[48625],
			signature=MECHATHUN_DRUID
		)
		existing_cluster.save()

		response = client.patch(
			f"/clusters/latest/FT_STANDARD/DRUID/{self.cluster.cluster_id}/",
			data=json.dumps({
				"archetype_id": archetype.id
			})
		)

		assert response.status_code == 200

		assert ClusterSnapshot.objects.filter(pk=self.cluster.id).count() == 0
		assert ClusterSnapshot.objects.filter(pk=existing_cluster.id).count() == 0

		new_cluster = ClusterSnapshot.objects.filter(external_id=archetype.id).first()

		assert new_cluster.name == archetype.name
		assert new_cluster.required_cards == [48625]


class TestClusterSnapshotRequiredCardsUpdateView:
	view = ClusterSnapshotRequiredCardsUpdateView()

	@pytest.fixture(autouse=True)
	def setup_method(self, db):
		self.cluster_set = ClusterSetSnapshot(latest=True)
		self.cluster_set.save()

		self.class_cluster = ClassClusterSnapshot(
			cluster_set=self.cluster_set,
			player_class=CardClass.PRIEST
		)
		self.class_cluster.save()

		self.cluster = ClusterSnapshot(
			class_cluster=self.class_cluster,
			cluster_id=1,
			data_points=[{
				"x": 0,
				"y": 0,
				"cards": _get_deck_from_deckstring(
					"AAECAa0GCO0Fw8EC0cEClsQCnccC3PUC8fsCiIIDC4oB+wHlBPIMysMCns4C8M8C6NACqe"
					"IC6uYCof4CAA=="""
				),
				"observations": 1
			}],
			signature=MECHATHUN_QUEST_PRIEST
		)
		self.cluster.save()

	@pytest.mark.django_db
	def test_delete(self, client):
		self.cluster.required_cards = [41494, 48625]
		self.cluster.save()

		response = client.delete(
			f"/clusters/latest/FT_STANDARD/PRIEST/{self.cluster.cluster_id}/41494/"
		)

		assert response.status_code == 200

		self.cluster.refresh_from_db()

		assert self.cluster.required_cards == [48625]

	@pytest.mark.django_db
	def test_put(self, client):
		self.cluster.required_cards = [48625]
		self.cluster.save()

		response = client.put(
			f"/clusters/latest/FT_STANDARD/PRIEST/{self.cluster.cluster_id}/41494/"
		)

		assert response.status_code == 200

		self.cluster.refresh_from_db()

		assert self.cluster.required_cards == [48625, 41494]
