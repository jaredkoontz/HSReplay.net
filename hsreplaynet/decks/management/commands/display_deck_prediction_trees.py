from django.core.management.base import BaseCommand
from hearthstone.enums import CardClass, FormatType

from hsreplaynet.utils.prediction import deck_prediction_tree


class Command(BaseCommand):
	def add_arguments(self, parser):
		pass

	def handle(self, *args, **options):
		for player_class in CardClass:
			if 2 <= int(player_class) <= 10:
				tree = deck_prediction_tree(player_class, FormatType.FT_STANDARD)
				tree.display(self.stdout)
