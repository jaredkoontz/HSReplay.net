class TestCheckoutNotificationView:

	def test_post(self, client, settings, user):
		client.force_login(user, backend=settings.AUTHENTICATION_BACKENDS[0])
		response = client.post("/account/billing/notify-checkout/")

		assert response.status_code == 200

		user.refresh_from_db()

		assert user.last_premium_checkout is not None
