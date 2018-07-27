import json

from django.http import JsonResponse
from django.views.generic.base import View

from hsreplaynet.ads.models import AdUnit


class AdUnitUpdateView(View):
	def patch(self, request, name):
		ad_unit = AdUnit.objects.filter(name=name).first()
		if not ad_unit:
			ad_unit = AdUnit.objects.create(name=name)

		payload = json.loads(request.body.decode())
		enabled = payload.get("enabled", False)
		if enabled != ad_unit.enabled:
			ad_unit.enabled = enabled
			ad_unit.save()

		return JsonResponse({"msg": "ok"}, status=200)
