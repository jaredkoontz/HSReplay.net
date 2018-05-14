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

	# OAuth2
	path("applications/", dashboard.ApplicationListView.as_view(), name="oauth2_app_list"),
	path(
		"application/<int:pk>/",
		dashboard.ApplicationUpdateView.as_view(), name="oauth2_app_update"
	),
	path(
		"application/<int:pk>/reset_secret/",
		dashboard.ResetSecretView.as_view(), name="oauth2_reset_secret"
	),
	path(
		"application/<int:pk>/revoke_all_tokens/",
		dashboard.RevokeAllTokensView.as_view(), name="oauth2_revoke_all_tokens"
	),
	path("revoke/", dashboard.UserRevocationView.as_view(), name="oauth2_revoke_access"),

	# Legacy
	path("claim/<uuid:id>/", ClaimAccountView.as_view(), name="account_claim"),

	# Allauth overrides
	path("login/", LoginView.as_view(), name="account_login"),
	path("", include("allauth.urls")),
]
