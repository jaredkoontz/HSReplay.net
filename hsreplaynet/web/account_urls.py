from django.conf.urls import include
from django.urls import path

from .views import LoginView, dashboard
from .views.legacy import ClaimAccountView


urlpatterns = [
	path("", dashboard.EditAccountView.as_view(), name="account_edit"),
	path("api/", dashboard.APIAccountView.as_view(), name="account_api"),
	path("api/hooks/new/", dashboard.WebhookCreateView.as_view(), name="account_new_webhook"),
	path(
		"api/hooks/<uuid:pk>/delete/",
		dashboard.WebhookDeleteView.as_view(), name="account_delete_webhook"
	),
	path(
		"api/hooks/<uuid:pk>/",
		dashboard.WebhookUpdateView.as_view(), name="account_update_webhook"
	),
	path("delete/", dashboard.DeleteAccountView.as_view(), name="account_delete"),
	path(
		"delete/replays/",
		dashboard.DeleteReplaysView.as_view(),
		name="account_delete_replays"
	),
	path("make_primary/", dashboard.MakePrimaryView.as_view(), name="account_make_primary"),

	# Email
	path(
		"email/preferences/",
		dashboard.EmailPreferencesView.as_view(),
		name="account_email_preferences"
	),

	# OAuth2
	path("applications/", dashboard.OAuth2ManageView.as_view(), name="oauth2_app_list"),
	path(
		"applications/<str:client_id>/",
		dashboard.ApplicationUpdateView.as_view(), name="oauth2_app_update"
	),

	# Legacy
	path("claim/<uuid:id>/", ClaimAccountView.as_view(), name="account_claim"),

	# Allauth overrides
	path("login/", LoginView.as_view(), name="account_login"),
	path("", include("allauth.urls")),
]
