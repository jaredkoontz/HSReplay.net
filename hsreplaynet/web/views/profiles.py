from django.contrib.auth import get_user_model
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import Http404
from django.utils.decorators import method_decorator
from django.utils.translation import gettext as _

from hsreplaynet.features.decorators import view_requires_feature_access

from . import SimpleReactView


@method_decorator(view_requires_feature_access("packs"), name="dispatch")
class PackListView(LoginRequiredMixin, SimpleReactView):
	bundle = "my_packs"


@method_decorator(view_requires_feature_access("profiles"), name="dispatch")
class ProfileView(LoginRequiredMixin, SimpleReactView):
	bundle = "profile"

	def get_react_context(self):
		user_id = self.kwargs.get("user_id")
		User = get_user_model()
		try:
			user = User.objects.get(pk=user_id)
		except User.DoesNotExist:
			raise Http404(_("User does not exist."))
		self.request.head.title = "%s's Profile" % user.username
		return {
			"username": user.username
		}
