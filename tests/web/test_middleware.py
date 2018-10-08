from django.contrib.auth.models import AnonymousUser
from rest_framework.test import APIRequestFactory

from hsreplaynet.web.middleware import UserActivityMiddleware


class TestUserActivityMiddleware:

	def setup_method(self):
		self.middleware = UserActivityMiddleware(lambda request: "Test Response")
		self.request_factory = APIRequestFactory()

	def test_call_unauthenticated(self):
		request = self.request_factory.get("/")
		request.user = AnonymousUser()

		assert self.middleware(request) == "Test Response"

	def test_call_authenticated(self, user):
		request = self.request_factory.get("/")
		request.user = user

		assert self.middleware(request) == "Test Response"
		assert user.last_site_activity is not None
