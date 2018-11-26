from hsreplay.document import HSReplayDocument
from tests.conftest import LOG_DATA_DIR

from hsreplaynet.games.exporters import GameDigestExporter


class TestGameDigestExporter:

	@staticmethod
	def _replay_path(name):
		return LOG_DATA_DIR + "/hsreplaynet-tests/replays/" + name

	def test_digest(self):
		with open(self._replay_path("annotated.druid_vs_warlock.xml"), "r") as f:
			replay = HSReplayDocument.from_xml_file(f)
			exporter = GameDigestExporter(replay.to_packet_tree()[0])
			exporter.export()

			assert exporter.player_1 == {
				"entity_id": 2,
				"hero_entity": 78,
				"hi": 144115198130930503,
				"lo": 15856412,
				"damage_sequence": [2, 1, 2, 4, 7, 10, 15, 19, 22, 28],
				"draw_sequence": [
					27, 34, 15, 33, 23, 28, 4, 21, 13, 31, 43, 15, 38, 7, 30, 39, 35, 18,
					40, 29, 32, 22, 8, 44, 91, 26, 12, 24, 25, 9, 14, 123, 34, 45, 138
				],
				"deck": set()
			}

			assert exporter.player_2 == {
				"entity_id": 3,
				"hero_entity": 196,
				"hi": 144115198130930503,
				"lo": 16145813,
				"damage_sequence": [
					1, 3, 4, 5, 6, 8, 9, 11, 13, 15, 11, 13, 15, 12, 14, 15, 18, 20, 21, 22,
					23, 28, 1, 2, 3, 6, 9, 11, 13, 16, 18, 20, 22, 2, 4, 12, 13, 10, 14, 16,
					17, 18, 22, 24, 12, 13, 16
				],
				"draw_sequence": [
					50, 75, 68, 49, 77, 65, 73, 74, 64, 66, 71, 70, 53, 54, 51, 58, 75, 55,
					48, 59, 63, 60, 56, 52, 76, 61, 57, 62, 72, 50, 67, 69
				],
				"deck": set()
			}

			assert exporter.digest == "ebb641612dd204e185bccd7764a8c5e4245d3c58"

	def test_digest_deck_swap(self):
		with open(self._replay_path("annotated.togwaggle.25770.hsreplay.xml"), "r") as f:
			replay = HSReplayDocument.from_xml_file(f)
			exporter = GameDigestExporter(replay.to_packet_tree()[0])
			exporter.export()

			assert exporter.player_1 == {
				"entity_id": 2,
				"hero_entity": 27,
				"hi": 144115202425897799,
				"lo": 41940206,
				"damage_sequence": [1, 2, 5, 9, 14],
				"draw_sequence": [
					11, 21, 19, 30, 8, 20, 11, 26, 33, 12, 7, 27, 21, 10, 29, 16, 15, 14, 4,
					19, 9, 24, 25, 31, 6
				],
				"deck": set()
			}

			assert exporter.player_2 == {
				"entity_id": 3,
				"hero_entity": 76,
				"hi": 144115202425897799,
				"lo": 83394735,
				"damage_sequence": [
					2, 5, 7, 9, 10, 12, 13, 16, 19, 21, 23, 26, 29, 28, 27, 26, 25, 24, 23,
					22, 21, 20, 19, 18, 17, 22, 23
				],
				"draw_sequence": [
					45, 47, 54, 48, 70, 71, 46, 42, 45, 47, 59, 38, 34, 41, 40, 44, 49, 52,
					58, 43, 66, 61, 51, 55, 35, 50, 65, 48, 67, 62, 18, 22, 32
				],
				"deck": {5, 13, 17, 23}
			}

			assert exporter.digest == "18f2ec256e13197ed8f39b91c86a48a4772a98f6"

	def test_digest_hero_change(self):
		with open(self._replay_path("annotated.hero_change.25770.hsreplay.xml"), "r") as f:
			replay = HSReplayDocument.from_xml_file(f)
			exporter = GameDigestExporter(replay.to_packet_tree()[0])
			exporter.export()

			assert exporter.player_1 == {
				"entity_id": 2,
				"hero_entity": 27,
				"hi": 144115193835963207,
				"lo": 153376707,
				"damage_sequence": [3, 7, 11, 15, 19, 21],
				"draw_sequence": [
					24, 39, 33, 12, 9, 19, 22, 32, 8, 21, 35, 23, 38, 6, 41, 34, 25, 31, 18,
					5, 15, 26, 40, 33, 20, 7, 14, 27
				],
				"deck": {4}
			}

			assert exporter.player_2 == {
				"entity_id": 3,
				"hero_entity": 74,
				"hi": 0,
				"lo": 0,
				"damage_sequence": [1, 4, 5, 6, 9, 12, 15, 17, 22, 25, 26, 28, 32],
				"draw_sequence": [
					47, 66, 46, 60, 48, 46, 49, 52, 61, 71, 53, 42, 63, 50, 58, 43, 56, 54,
					51, 68
				],
				"deck": {44, 45, 55, 57, 59, 62, 64, 65, 67, 69, 70}
			}

			assert exporter.digest == "94b7626ed21f4572e16ba8201f6f6cf5b918e164"

	def test_digest_multi_hero_brawl(self):
		with open(self._replay_path(
			"annotated.multi_hero_brawl.25252.hsreplay.xml"
		), "r") as f:

			replay = HSReplayDocument.from_xml_file(f)
			exporter = GameDigestExporter(replay.to_packet_tree()[0])
			exporter.export()

			assert exporter.player_1 == {
				"entity_id": 2,
				"hero_entity": 30,
				"hi": 144115193835963207,
				"lo": 37760170,
				"damage_sequence": [
					2, 3, 5, 6, 7, 9, 10, 11, 13, 16, 17, 19, 21, 16, 22, 28, 24, 21, 18,
					15, 12, 9, 6, 14, 11, 8, 16, 13, 14, 11, 19, 16, 12, 20, 21, 18, 20, 17,
					20
				],
				"draw_sequence": [
					25, 8, 33, 26, 30, 32, 23, 9, 6, 29, 14, 16, 17, 33, 15, 19, 4, 20, 21,
					13, 24, 27, 31, 28, 7, 11, 22, 18, 12, 10
				],
				"deck": set()
			}

			assert exporter.player_2 == {
				"entity_id": 3,
				"hero_entity": 196,
				"hi": 0,
				"lo": 0,
				"damage_sequence": [
					2, 6, 8, 10, 14, 3, 7, 11, 19, 27, 14, 17, 21, 25, 27, 35, 27, 33, 37,
					45, 51, 55, 58, 61, 59, 35, 36, 41, 46, 49, 50, 54, 57, 60
				],
				"draw_sequence": [
					58, 41, 50, 45, 47, 63, 54, 56, 48, 46, 41, 43, 39, 132, 112, 125, 119,
					115, 114, 106, 127, 131, 128, 107, 55, 60, 51, 42, 61, 44, 35, 105, 116,
					110, 103, 126, 124, 104, 52, 40, 37, 36, 38, 49, 34, 62, 35, 57, 53, 51,
					61, 44, 55, 59, 60
				],
				"deck": set()
			}

			assert exporter.digest == "2eb551cb0c7b21d95fd96cdf79755b23346a2514"

	def test_digest_symmetric(self):
		with open(self._replay_path("annotated.symmetric_a.25770.hsreplay.xml"), "r") as f1:
			replay = HSReplayDocument.from_xml_file(f1)
			exporter1 = GameDigestExporter(replay.to_packet_tree()[0])
			exporter1.export()

		with open(self._replay_path("annotated.symmetric_b.25770.hsreplay.xml"), "r") as f2:
			replay = HSReplayDocument.from_xml_file(f2)
			exporter2 = GameDigestExporter(replay.to_packet_tree()[0])
			exporter2.export()

		assert exporter1.digest == exporter2.digest

	def test_digest_symmetric_with_card_swap(self):
		with open(self._replay_path(
			"annotated.symmetric_card_swap_a.27358.hsreplay.xml"
		), "r") as f1:
			replay = HSReplayDocument.from_xml_file(f1)
			exporter1 = GameDigestExporter(replay.to_packet_tree()[0])
			exporter1.export()

		with open(self._replay_path(
			"annotated.symmetric_card_swap_b.27358.hsreplay.xml"
		), "r") as f2:
			replay = HSReplayDocument.from_xml_file(f2)
			exporter2 = GameDigestExporter(replay.to_packet_tree()[0])
			exporter2.export()

		assert exporter1.digest == exporter2.digest

	def test_friendly_game_player_tag_changes(self):
		with open(self._replay_path(
			"annotated.friendly_game.27641.hsreplay.xml"
		), "r") as f:

			replay = HSReplayDocument.from_xml_file(f)
			exporter = GameDigestExporter(replay.to_packet_tree()[0])
			exporter.export()

			assert exporter.player_1 == {
				"entity_id": 2,
				"hero_entity": 70,
				"hi": 144115198130930503,
				"lo": 116559778,
				"damage_sequence": [1, 2, 4, 15, 16, 18],
				"draw_sequence": [
					22, 11, 16, 4, 20, 8, 17, 27, 5, 7, 31, 15, 9, 10, 12, 26
				],
				"deck": {6, 11, 13, 14, 16, 18, 19, 21, 23, 24, 25, 28, 29, 30, 32, 33}
			}

			assert exporter.player_2 == {
				"entity_id": 3,
				"hero_entity": 72,
				"hi": 144115198130930503,
				"lo": 102703618,
				"damage_sequence": [9, 20, 31],
				"draw_sequence": [
					44, 66, 56, 63, 48, 45, 39, 68, 66, 43, 63, 38, 60, 50, 64, 47
				],
				"deck": {34, 35, 36, 37, 40, 44, 46, 49, 53, 54, 55, 59, 61, 62, 65, 67, 69}
			}

			assert exporter.digest == "e3adbcc2edc12ae39f96a61826e49c7826417e54"
