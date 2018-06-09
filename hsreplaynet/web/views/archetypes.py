from django.http import Http404
from django.shortcuts import get_object_or_404, render
from django.utils.translation import gettext_lazy as _
from django.views.generic import TemplateView, View

from hsreplaynet.decks.models import Archetype

from . import SimpleReactView
from ..html import RequestMetaMixin


##
# Archetype pages

class MetaOverviewView(SimpleReactView):
	title = _("Hearthstone Meta")
	description = _(
		"Explore the Hearthstone meta game and find out "
		"how the archetypes match up."
	)
	bundle = "meta_overview"
	bundles = ("stats", "meta_overview")


class DiscoverView(RequestMetaMixin, TemplateView):
	template_name = "decks/discover.html"
	title = _("Discover")
	description = _(
		"Engage with the up-and-coming Hearthstone meta game "
		"to discover the newest archetypes and what's next."
	)

	def get_context_data(self, **kwargs):
		context = super().get_context_data(**kwargs)
		context["hide_footer"] = True
		return context


class ArchetypeDetailView(RequestMetaMixin, View):
	template_name = "archetypes/archetype_detail.html"
	title = _("Archetype")

	def get(self, request, id, slug):
		archetype = get_object_or_404(Archetype, id=id)
		if archetype.deleted:
			raise Http404(_("This archetype is no longer available."))

		request.head.title = archetype.name
		request.head.set_canonical_url(archetype.get_absolute_url())

		context = {
			"archetype": archetype,
			"has_standard_data": archetype.standard_signature is not None,
			"has_wild_data": archetype.wild_signature is not None,
		}

		return render(request, self.template_name, context)
