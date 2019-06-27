from django.contrib import admin
from django.contrib.auth.decorators import login_required
from django.urls import include, path

from .views import AdminMetaView


admin.site.login = login_required(
	admin.site.login,
	login_url="/account/login/",
	redirect_field_name="next"
)

urlpatterns = [
	path("_debug/", AdminMetaView.as_view()),
	path("loginas/", include("loginas.urls")),
	path("", admin.site.urls),
]
