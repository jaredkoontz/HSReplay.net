from django.conf import settings
from django.db import models
from django_hearthstone.cards.models import Card
from django_intenum import IntEnumField
from hearthstone.enums import Booster


class Pack(models.Model):
	id = models.BigAutoField(primary_key=True)
	booster_type = IntEnumField(enum=Booster)
	date = models.DateTimeField()
	cards = models.ManyToManyField(Card, through="packs.PackCard")
	user = models.ForeignKey(
		settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
		related_name="packs"
	)
	blizzard_account = models.ForeignKey(
		"accounts.BlizzardAccount", on_delete=models.CASCADE, related_name="packs"
	)

	def __str__(self):
		cards = self.cards.all()
		if not cards:
			return "(Empty pack)"
		return ", ".join(str(card) for card in cards)


class PackCard(models.Model):
	id = models.BigAutoField(primary_key=True)
	pack = models.ForeignKey(Pack, on_delete=models.CASCADE)
	card = models.ForeignKey(Card, on_delete=models.PROTECT)
	premium = models.BooleanField()

	def __str__(self):
		if self.premium:
			return f"{str(self.card)} (Golden)"
		else:
			return str(self.card)
