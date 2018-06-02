from django.conf.urls import url

from .views import ClusterSnapshotUpdateView
from .api import DeckDetailView, DeckFeedbackView, GetOrCreateDeckView, MyDecksAPIView


urlpatterns = [
	# TODO: move me to api
	url(
		r"^clusters/latest/(?P<game_format>\w+)/(?P<player_class>\w+)/(?P<cluster_id>\w+)/",
		ClusterSnapshotUpdateView.as_view(), name="update_cluster_archetype"
	),
]

api_urlpatterns = [
	url(r"^v1/analytics/decks/summary/$", MyDecksAPIView.as_view()),
	url(r"^v1/decks/$", GetOrCreateDeckView.as_view()),
	url(r"^v1/decks/(?P<shortid>\w+)/$", DeckDetailView.as_view()),
	url(r"^v1/decks/(?P<shortid>\w+)/feedback/$", DeckFeedbackView.as_view()),
]
