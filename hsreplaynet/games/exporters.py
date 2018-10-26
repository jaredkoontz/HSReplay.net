import hashlib

from hearthstone.enums import GameTag, Zone
from hslog.export import EntityTreeExporter


class GameDigestExporter(EntityTreeExporter):
	"""An exporter that computes a digest for a packet tree based only on Power.log features

	This exporter examines game events to create a globally unique fingerprint for a game
	without needing to read memory. The fingerprint is created as the SHA-1 hash of the
	following items:
		- The eight-byte representation of player 1's account hi
		- The four-byte representation of player 1's account lo
		- The eight-byte representation of player 2's account hi
		- The four-byte representation of player 2's account lo
		- The four-byte representation of each entity id in player 1's draw sequence
		- The four-byte representation of each entity id in player 2's draw sequence
		- The four-byte representation of each value in player 1's damage sequence
		- The four-byte representation of each value in player 2's damage sequence

	Generate the digest by requesting the "digest" property of this exporter after calling
	"export."

	:param packet_tree: The packet tree to export
	"""

	def __init__(self, packet_tree):
		"""Constructor.

		:param packet_tree: The packet tree produced by the hslog parser
		"""

		super().__init__(packet_tree)

		self.player_1 = None
		self.player_2 = None
		self.entities = dict()

	def _get_player_by_controller(self, controller):
		if controller == 1:
			return self.player_1
		elif controller == 2:
			return self.player_2
		else:
			return None

	def handle_player(self, packet):
		super().handle_player(packet)

		tags = dict(packet.tags)
		entity_id = tags.get(GameTag.ENTITY_ID)
		hero_entity = tags.get(GameTag.HERO_ENTITY)

		# Initialize the player data structures.

		if entity_id and hero_entity:
			player_dict = dict(
				entity_id=entity_id,
				hero_entity=hero_entity,
				hi=packet.hi,
				lo=packet.lo,
				damage_sequence=[],
				draw_sequence=[],
				deck=set()
			)
			if packet.player_id == 1:
				self.player_1 = player_dict
			elif packet.player_id == 2:
				self.player_2 = player_dict

	def handle_full_entity(self, packet):
		super().handle_full_entity(packet)

		tags = dict(packet.tags)

		controller = tags.get(GameTag.CONTROLLER)
		entity_id = tags.get(GameTag.ENTITY_ID)

		self.entities[entity_id] = tags

		# Fill up each player's deck (in terms of card entity ids) from the list of initial
		# full entity packets.

		if controller and entity_id and tags.get(GameTag.ZONE) == Zone.DECK:
			player = self._get_player_by_controller(controller)
			if player:
				player["deck"].add(entity_id)

	@staticmethod
	def _update_zone(controller, entity):
		if entity in controller["deck"]:
			controller["draw_sequence"].append(entity)
			controller["deck"].remove(entity)

	def handle_show_entity(self, packet):
		super().handle_show_entity(packet)

		tags = dict(packet.tags)

		controller_id = tags.get(GameTag.CONTROLLER)

		# Some older replays don't include the controller tag on the show entity packet...
		# but we might have seen it on the original FullEntity packet, so let's look for it
		# there. Doesn't hurt!

		if not controller_id:
			if packet.entity in self.entities:
				controller_id = self.entities[packet.entity].get(GameTag.CONTROLLER)

		if controller_id:

			# Draws for the friendly player are represented in Power.log as SHOW_ENTITY
			# packets with changes to the ZONE tag.

			if GameTag.ZONE in tags and tags[GameTag.ZONE] == Zone.HAND:
				player = self._get_player_by_controller(controller_id)
				if player:
					self._update_zone(player, packet.entity)

	def handle_tag_change(self, packet):
		super().handle_tag_change(packet)

		if self.player_1 and self.player_2:
			if packet.tag == GameTag.ZONE:

				# Who's the current player?

				entity = self.entities[packet.entity]
				controller_id = entity[GameTag.CONTROLLER]

				controller = self._get_player_by_controller(controller_id)

				if controller:

					# If the card moved from the player's deck to their hand, add it to the
					# draw sequence and remove it from their deck.

					if packet.value == Zone.HAND:
						self._update_zone(controller, packet.entity)
					elif packet.value == Zone.DECK:

						# If the card moved to the player's deck, add it to their deck set
						# so that we can count it as drawn later.

						controller["deck"].add(packet.entity)

			# Damage changes are applied to the player's hero card, so map the target entity
			# to the player's hero card entity. Ignore zero damage notifications - they're
			# not symmetrically visible and so shouldn't be allowed to affect the hash.

			elif packet.tag == GameTag.DAMAGE and packet.value != 0:
				if packet.entity == self.player_1["hero_entity"]:
					self.player_1["damage_sequence"].append(packet.value)
				elif packet.entity == self.player_2["hero_entity"]:
					self.player_2["damage_sequence"].append(packet.value)

			elif packet.tag == GameTag.HERO_ENTITY:
				if packet.entity == self.player_1["entity_id"]:
					self.player_1["hero_entity"] = packet.value
				elif packet.entity == self.player_2["entity_id"]:
					self.player_2["hero_entity"] = packet.value

	@property
	def digest(self):
		if self.player_1 and self.player_2:
			hash_digest = hashlib.sha1()

			# Update the digest object with the bytes from the player draw and damage
			# sequences.

			def _update(val, width=4):
				hash_digest.update(val.to_bytes(width, byteorder="big"))

			_update(self.player_1["hi"], width=8)
			_update(self.player_1["lo"])
			_update(self.player_2["hi"], width=8)
			_update(self.player_2["lo"])

			sequences = (
				self.player_1["draw_sequence"],
				self.player_2["draw_sequence"],
				self.player_1["damage_sequence"],
				self.player_2["damage_sequence"]
			)
			for sequence in sequences:
				for entity_id in sequence:
					_update(entity_id)
				_update(0)

			return hash_digest.hexdigest()
		else:
			raise RuntimeError("Can't compute digest without player packets")
