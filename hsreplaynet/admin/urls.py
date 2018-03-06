from django.conf.urls import include, url
from django.contrib import admin
from django.contrib.auth.decorators import login_required

from .views import AdminMetaView


admin.site.login = login_required(admin.site.login)

urlpatterns = [
	url(r"^_debug/", AdminMetaView.as_view()),
	url(r"^loginas/", include("loginas.urls")),
	url(r"^", admin.site.urls),
]
