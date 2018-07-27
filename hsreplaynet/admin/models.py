from django.db import models


class AdUnit(models.Model):
	name = models.CharField(max_length=255, null=False, unique=True)
	description = models.TextField(blank=True)
	enabled = models.BooleanField(default=False)

	def __str__(self):
		return self.name
