import csv
import json
from hashlib import sha256
from hmac import HMAC
from io import StringIO

from django.conf import settings
from django.core.management.base import BaseCommand
from hearthstone.enums import Booster

from hsreplaynet.packs.models import Pack, PackCard


VALID_BOOSTERS = [bt.name for bt in Booster.__members__.values()]


def anonymize(value):
	key = settings.SECRET_KEY.encode("utf-8")
	h = HMAC(key, str(value).encode("utf-8"), digestmod=sha256)
	return h.hexdigest()


class Command(BaseCommand):
	def add_arguments(self, parser):
		parser.add_argument(
			"--booster-type", choices=VALID_BOOSTERS, help="Filter by booster type"
		)
		parser.add_argument(
			"--username", help="Filter by username"
		)
		parser.add_argument("--format", choices=("csv", "json"), default="csv")

	def get_rows(self, qs):
		rows = []
		for pack in qs:
			cards = PackCard.objects.filter(pack=pack)
			ba = pack.blizzard_account
			row = [
				pack.id, ba.region.name, ba.account_hi, ba.account_lo,
				pack.booster_type.name, pack.date.isoformat()
			]
			for card in cards:
				row += [card.card_id, int(card.premium)]
			rows.append(row)

		return rows

	def handle(self, *args, **options):
		packs = Pack.objects.all()
		booster_type = options.get("booster_type")
		if booster_type:
			booster_type = Booster[booster_type]
			packs = packs.filter(booster_type=booster_type)

		username = options.get("username", "")
		if username:
			packs = packs.filter(user__username=username)

		rows = self.get_rows(packs)
		value = ""

		format = options["format"]
		if format == "csv":
			s = StringIO()
			writer = csv.writer(s)
			for row in rows:
				writer.writerow(row)
			value = s.getvalue()
		elif format == "json":
			value = json.dumps(rows, indent="\t")

		self.stdout.write(value)
