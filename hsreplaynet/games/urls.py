from django.conf.urls import url
from django.views.generic import RedirectView

from .views import MyReplaysView


urlpatterns = [
	url(r"^$", RedirectView.as_view(pattern_name="my_replays", permanent=False)),
	url(r"^mine/$", MyReplaysView.as_view(), name="my_replays"),
]
