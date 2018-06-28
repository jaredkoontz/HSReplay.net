from django.conf.urls import url

from . import views


urlpatterns = [
	url(r"^v1/example/$", views.ExampleView.as_view()),
]
