from django.core.management.base import BaseCommand
from hearthstone.enums import FormatType

from hsreplaynet.decks.models import Archetype, Deck


class Command(BaseCommand):
	def handle(self, *args, **options):
		for game_format in (FormatType.FT_STANDARD, FormatType.FT_WILD):
			print("\n\nStarting: %s" % game_format.name)

			deck_archetype_map = Archetype.objects._get_deck_archetype_map_from_redshift(
				game_format
			)
			digests = list(deck_archetype_map.keys())

			qs = list(Deck.objects.filter(digest__in=digests))
			total_decks = len(qs)
			print("About to Sync %i Decks" % total_decks)
			counter = 0
			for deck in qs:
				counter += 1
				if deck.archetype_id != deck_archetype_map[deck.digest]:
					deck.sync_archetype_to_firehose()
				if counter % 1000 == 0:
					print("Counter: %i" % counter)
