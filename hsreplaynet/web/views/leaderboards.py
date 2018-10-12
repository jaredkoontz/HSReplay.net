from django.contrib.auth.mixins import LoginRequiredMixin
from django.utils.decorators import method_decorator

from hsreplaynet.features.decorators import view_requires_feature_access

from . import SimpleReactView


@method_decorator(view_requires_feature_access("leaderboards"), name="dispatch")
class LeaderboardsView(LoginRequiredMixin, SimpleReactView):
	bundle = "leaderboards"
