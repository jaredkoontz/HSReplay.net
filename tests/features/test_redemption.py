import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from hsreplaynet.api.views.features import RedeemCodeView
from hsreplaynet.features.models import (
	Feature, FeatureInvite, FeatureInviteAlias, FeatureStatus
)


User = get_user_model()


class TestInviteRedemption:
	@pytest.fixture(autouse=True)
	def setup_method(self, db, mocker):
		mocker.patch.multiple(
			"hsreplaynet.api.views.features.RedeemCodeView",
			throttle_classes=(),
		)
		Feature(name="awesome", status=FeatureStatus.AUTHORIZED_ONLY).save()
		User(username="freddy").save()

	@pytest.mark.django_db
	def test_redeem_feature_invite(self):
		invite = FeatureInvite()
		invite.save()

		feature = Feature.objects.get(name="awesome")
		feature.invites.add(invite)
		feature.save()

		assert invite.is_valid

		factory = APIRequestFactory()
		user = User.objects.get(username="freddy")
		view = RedeemCodeView.as_view()

		request = factory.post("/api/v1/accounts/", format="json", data={"code": invite.uuid})
		force_authenticate(request, user=user)
		response = view(request)

		invite.refresh_from_db()
		assert response.status_code == status.HTTP_200_OK
		assert invite.use_count == 1
		assert feature.enabled_for_user(user)

	@pytest.mark.django_db
	def test_redeem_feature_invite_alias(self, client):
		invite = FeatureInvite()
		invite.save()

		feature = Feature.objects.get(name="awesome")
		feature.invites.add(invite)
		feature.save()

		alias = FeatureInviteAlias(code="ABCDEF", invite=invite)
		alias.save()
		assert alias.is_valid
		assert not alias.redeemed

		factory = APIRequestFactory()
		user = User.objects.get(username="freddy")
		view = RedeemCodeView.as_view()

		request = factory.post("/api/v1/accounts/", format="json", data={"code": alias.code})
		force_authenticate(request, user=user)
		response = view(request)

		alias.refresh_from_db()
		invite.refresh_from_db()
		assert response.status_code == status.HTTP_200_OK
		assert alias.redeemed_by == user
		assert alias.redeemed
		assert invite.use_count == 1
		assert feature.enabled_for_user(user)

		# try
		request = factory.post("/api/v1/accounts/", format="json", data={"code": alias.code})
		force_authenticate(request, user=user)
		response = view(request)
		assert response.status_code == status.HTTP_403_FORBIDDEN
