from django.contrib.auth.mixins import LoginRequiredMixin
from django.utils.decorators import method_decorator
from django.views.generic import TemplateView

from hsreplaynet.features.decorators import view_requires_feature_access
from hsreplaynet.web.html import RequestMetaMixin


@method_decorator(view_requires_feature_access("profiles"), name="dispatch")
class HighlightsView(LoginRequiredMixin, RequestMetaMixin, TemplateView):
	template_name = "profiles/highlights.html"


@method_decorator(view_requires_feature_access("packs"), name="dispatch")
class PackListView(LoginRequiredMixin, RequestMetaMixin, TemplateView):
	template_name = "profiles/packs.html"

	def get_context_data(self, **kwargs):
		context = super().get_context_data(**kwargs)
		context["packs"] = self.request.user.pack_set.all()
		return context
