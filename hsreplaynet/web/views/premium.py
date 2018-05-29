import random

from django.views.generic import TemplateView
from django_reflinks.models import ReferralLink
from shortuuid import ShortUUID

from hsreplaynet.web.html import RequestMetaMixin


class PremiumDetailView(RequestMetaMixin, TemplateView):
	template_name = "premium/premium_detail.html"
	title = "HSReplay.net Premium"
	description = "More filters, more features, more data: Gain access to advanced " \
		"Hearthstone statistics backed by millions of games with HSReplay.net Premium " \
		"for HSReplay.net."

	quotes = [
		"It only cost my soul!",
		"Mind if I roll Need?",
		"I hope you like my invention!",
		"Who knows what secrets we'll uncover?",
		"You require my assistance?",
		"Don't worry love, the cavalry's here!",
		"Put your faith in the stats.",
		"The gates are open!",
		"Are you ready for this?",
		"Join, or die… or both!",
		"D-d-don't touch that!",
		"Wanna blow somethin' up?",
		"I have no time for games!",
		"Support a small indie company!",
		"Everyone, get in here!",
	]

	def get_context_data(self, **kwargs):
		context = super().get_context_data(**kwargs)
		context["random_quote"] = random.choice(self.quotes)
		user = self.request.user

		if user.is_authenticated:
			context["reflink"] = ReferralLink.objects.filter(user=user).first()
			if not context["reflink"]:
				context["reflink"] = ReferralLink.objects.create(
					identifier=ShortUUID().uuid()[:6], user=user
				)

		return context
