from django.conf import settings


def lang_to_blizzard(lang: str) -> str:
	if lang not in settings.LANGUAGE_MAP:
		lang = settings.LANGUAGE_CODE
	return settings.LANGUAGE_MAP[lang][0]


def lang_to_opengraph(lang: str) -> str:
	if lang not in settings.LANGUAGE_MAP:
		lang = settings.LANGUAGE_CODE
	return settings.LANGUAGE_MAP[lang][1]
