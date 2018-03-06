import platform

from django.contrib.admin.views.decorators import staff_member_required
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View


@method_decorator(staff_member_required, name="dispatch")
class AdminMetaView(View):
	def get(self, request):
		return JsonResponse({
			"user_id": request.user.id,
			"username": request.user.username,
			"hostname": platform.node(),
			"headers": {k: v for k, v in request.META.items() if k.startswith("HTTP_")},
		})
