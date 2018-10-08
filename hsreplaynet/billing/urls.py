from django.conf.urls import include, url
from djpaypal.views import ProcessWebhookView

from . import views


billing_settings = views.BillingView.as_view()
update_card = views.UpdateCardView.as_view()
subscribe = views.SubscribeView.as_view()
cancel_subscription = views.CancelSubscriptionView.as_view()
notify_checkout = views.CheckoutNotificationView.as_view()

urlpatterns = [
	url(r"^$", billing_settings, name="billing_methods"),
	url(r"^card/update/$", update_card, name="billing_update_card"),
	url(r"^stripe/", include("djstripe.urls", namespace="djstripe")),
	url(r"^subscribe/", subscribe, name="premium_subscribe"),
	url(r"^cancel-subscription/", cancel_subscription, name="premium_cancel"),
	url(r"^paypal/cancel/", views.PaypalCancelView.as_view(), name="pp_cancel"),
	url(r"^paypal/subscribe/", views.PaypalSubscribeView.as_view(), name="pp_subscribe"),
	url(r"^paypal/return/", views.PaypalSuccessView.as_view(), name="pp_success"),
	url(r"^paypal/webhook/", ProcessWebhookView.as_view(), name="pp_webhook"),
	url(r"^notify-checkout/$", notify_checkout, name="checkout_notification"),
]
