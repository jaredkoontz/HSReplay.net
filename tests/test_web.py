import pytest
from allauth.socialaccount.providers import registry
from django.conf import settings
from django.test.client import RequestFactory
from django_hearthstone.cards.models import Card

from hsreplaynet.web.html import HTMLHead
from hsreplaynet.web.views.cards import CardDetailView


def test_battlenet_auth_loaded():
	assert registry.loaded
	provider = registry.by_id("battlenet")
	assert provider.id == "battlenet"


@pytest.mark.django_db
def test_load_homepage(client, settings, mocker):
	# Disable (Manifest)StaticFilesStorage, since tests will not run collectstatic
	settings.STATICFILES_STORAGE = settings.DEFAULT_FILE_STORAGE

	response = client.get("/")
	assert response.status_code == 200


def test_htmlhead_hreflang():
	rf = RequestFactory()
	request = rf.get("/cards/613/default/")
	head = HTMLHead(request)

	head.set_hreflang(lambda lang: "/cards/613/x-%s/" % lang)

	hreflang_tags = [
		t for t in head.get_tags() if t.tag_name == "link" and "hreflang" in t.attrs
	]

	def get_lang_tag(lang):
		for tag in hreflang_tags:
			if tag.attrs["hreflang"] == lang:
				return tag
		assert False, "Missing tag for %s" % lang

	for lang, _ in settings.LANGUAGES:
		tag = get_lang_tag(lang)
		assert tag
		assert tag.attrs["href"].endswith("/cards/613/x-%s/?hl=%s" % (lang, lang))

	default_tag = get_lang_tag("x-default")
	assert default_tag
	assert default_tag.attrs["href"].endswith("cards/613/default/")


@pytest.mark.django_db
def test_card_detail_hreflang():
	view = CardDetailView()
	card = Card.objects.get(dbf_id=613)
	hreflang = view.get_hreflang(card, "de")
	assert hreflang == "/cards/613/machtwort-schild"
