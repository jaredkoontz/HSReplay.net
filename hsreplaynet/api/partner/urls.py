from django.conf.urls import url

from . import views


urlpatterns = [
	url(r"^v1/archetypes/$", views.ArchetypesView.as_view()),
	url(r"^v1/cards/$", views.CardsView.as_view()),
	url(r"^v1/classes/$", views.ClassesView.as_view()),
]
