from django.urls import include, path
from djpaypal.views import ProcessWebhookView

from . import views


billing_settings = views.BillingView.as_view()
update_card = views.UpdateCardView.as_view()
subscribe = views.SubscribeView.as_view()
cancel_subscription = views.CancelSubscriptionView.as_view()
notify_checkout = views.CheckoutNotificationView.as_view()

urlpatterns = [
	path("", billing_settings, name="billing_methods"),
	path("card/update/", update_card, name="billing_update_card"),
	path("stripe/", include("djstripe.urls", namespace="djstripe")),
	path("subscribe/", subscribe, name="premium_subscribe"),
	path("cancel-subscription/", cancel_subscription, name="premium_cancel"),
	path("paypal/cancel/", views.PaypalCancelView.as_view(), name="pp_cancel"),
	path("paypal/subscribe/", views.PaypalSubscribeView.as_view(), name="pp_subscribe"),
	path("paypal/return/", views.PaypalSuccessView.as_view(), name="pp_success"),
	path("paypal/webhook/", ProcessWebhookView.as_view(), name="pp_webhook"),
	path("notify-checkout/", notify_checkout, name="checkout_notification"),
]
