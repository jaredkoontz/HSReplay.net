from django.conf.urls import url
from django.views.generic import RedirectView

from . import views
from .api import DeckDetailView, DeckFeedbackView, GetOrCreateDeckView, MyDecksAPIView


archetype_detail = views.ArchetypeDetailView.as_view()
card_detail = views.CardDetailView.as_view()
card_editor = views.CardEditorView.as_view()
cards = views.CardsView.as_view()
my_cards = views.MyCardsView.as_view()

deck_detail = views.DeckDetailView.as_view()
decks = views.DecksView.as_view()
trending_decks = views.TrendingDecksView.as_view()
my_decks = views.MyDecksView.as_view()
meta_overview = views.MetaOverviewView.as_view()
discover = views.DiscoverView.as_view()
update_cluster_archetype = views.ClusterSnapshotUpdateView.as_view()


urlpatterns = [
	url(r"^cards/$", cards, name="cards"),
	url(r"^cards/editor/", card_editor, name="card_editor"),
	url(r"^cards/gallery/$", RedirectView.as_view(pattern_name="cards", permanent=True)),
	url(r"^cards/mine/$", my_cards, name="my_cards"),
	url(r"^cards/(?P<pk>\w+)/(?P<slug>[\w-]+)?", card_detail, name="card_detail"),
	url(
		r"^clusters/latest/(?P<game_format>\w+)/(?P<player_class>\w+)/(?P<cluster_id>\w+)/",
		update_cluster_archetype, name="update_cluster_archetype"
	),
	url(r"^decks/$", decks, name="decks"),
	url(r"^decks/mine/$", my_decks, name="my_decks"),
	url(r"^decks/trending/", trending_decks, name="trending_decks"),
	url(r"^decks/(?P<id>\w+)/$", deck_detail, name="deck_detail"),
	url(r"^discover/$", discover, name="discover"),
	url(r"^meta/$", meta_overview, name="meta_overview"),
	url(
		r"^archetypes/$",
		RedirectView.as_view(pattern_name="meta_overview", permanent=False)
	),
	url(
		r"^archetypes/(?P<id>\d+)/(?P<slug>[\w-]+)?",
		archetype_detail, name="archetype_detail"
	),
]

api_urlpatterns = [
	url(r"^v1/analytics/decks/summary/$", MyDecksAPIView.as_view()),
	url(r"^v1/decks/$", GetOrCreateDeckView.as_view()),
	url(r"^v1/decks/(?P<shortid>\w+)/$", DeckDetailView.as_view()),
	url(r"^v1/decks/(?P<shortid>\w+)/feedback/$", DeckFeedbackView.as_view()),
]
