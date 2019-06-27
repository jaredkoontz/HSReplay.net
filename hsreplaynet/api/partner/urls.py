from django.urls import path

from . import views


urlpatterns = [
	path("archetypes/", views.ArchetypesView.as_view()),
	path("cards/", views.CardsView.as_view()),
	path("classes/", views.ClassesView.as_view()),
]
