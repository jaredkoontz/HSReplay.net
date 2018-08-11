from django.contrib import messages
from django.contrib.auth import REDIRECT_FIELD_NAME
from django.contrib.auth.mixins import LoginRequiredMixin
from django.forms import CharField, Form, TextInput, ValidationError
from django.shortcuts import redirect
from django.urls import reverse_lazy
from django.utils.http import is_safe_url
from django.views.generic import FormView

from hsreplaynet.features.models import FeatureError, FeatureInvite

from . import SimpleReactView


class RedeemCodeForm(Form):
	uuid = CharField(label="Code", required=True, widget=TextInput(attrs={"size": 40}))

	def clean_uuid(self):
		try:
			feature = FeatureInvite.objects.get(uuid=self.cleaned_data["uuid"])
		except (ValueError, FeatureInvite.DoesNotExist):
			raise ValidationError("This code is not valid.")
		return feature.uuid


class RedeemCodeView(LoginRequiredMixin, SimpleReactView, FormView):
	form_class = RedeemCodeForm
	success_url = reverse_lazy("redeem_code")
	bundle = "redeem_code"

	def form_valid(self, form):
		invite = FeatureInvite.objects.get(uuid=form.cleaned_data["uuid"])
		try:
			# TODO: invite had no side effect if redeem_for_user returns False
			invite.redeem_for_user(self.request.user)
		except FeatureError:
			messages.error(self.request, "This code has expired.")
		else:
			messages.info(self.request, "Code successfully redeemed.")

			next = self.request.GET.get(REDIRECT_FIELD_NAME)
			# is_safe_url() will ensure we don't redirect to another domain
			if next and is_safe_url(next, allowed_hosts=None):
				return redirect(next)

		return super().form_valid(form)

	def get_react_context(self):
		ret = {}
		if "code" in self.request.GET:
			ret["code"] = self.request.GET["code"][:40]
		return ret
