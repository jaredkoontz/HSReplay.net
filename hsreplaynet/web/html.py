from urllib.parse import urlparse

from django.conf import settings
from django.contrib.staticfiles.templatetags.staticfiles import static
from django.http import QueryDict
from django.utils.html import escape


class HTMLTag:
	def __init__(self, tag_name, content=None, attrs=None):
		self.tag_name = tag_name
		self.content = content
		self.attrs = attrs or {}

	def __str__(self):
		return self.render()

	def render(self):
		tag = self.tag_name
		attrs = self.render_attributes()
		if attrs:
			tag += " " + attrs

		if self.content is not None:
			return "<%s>%s</%s>" % (tag, escape(self.content), self.tag_name)
		else:
			return "<%s/>" % (tag)

	def render_attributes(self):
		if not self.attrs:
			return ""
		return " ".join('%s="%s"' % (k, escape(str(v))) for k, v in self.attrs.items())


class HTMLHead:
	def __init__(self, request):
		self._meta_tags = []
		self._link_tags = []
		self._script_tags = []
		self.request = request
		self.charset = "utf-8"
		self.base_title = "HSReplay.net"
		self.title = ""
		self.canonical_url = ""
		self.hreflang = None
		self.opengraph = {}
		# self.favicon = ""

		self.favicon = "images/favicon.ico"
		self.apple_touch_icon = "images/hsreplay-thumbnail.png"
		self.mask_icon = "images/mask-icon.svg"
		self.add_stylesheets(
			"vendor/bootstrap/css/bootstrap.min.css",
			"https://fonts.googleapis.com/css?family=Noto+Sans:400,700",
			"https://fonts.googleapis.com/css?family=Montserrat:800",
		)
		self.add_opensearch(href="opensearch.xml", title="HSReplay.net")
		self.add_meta({"name": "theme-color", "content": "#1d3657"})

	def __str__(self):
		return "".join(str(tag) for tag in self.get_tags())

	def get_tags(self):
		tags = []

		if self.charset:
			tags.append(HTMLTag("meta", attrs={"charset": "utf-8"}))

		title = self.get_title()
		if title:
			tags.append(HTMLTag("title", content=title))
			self.opengraph["og:title"] = title

		tags += self._meta_tags

		if self.favicon:
			url = static(self.favicon)
			tags.append(
				HTMLTag("link", attrs={"rel": "icon", "type": "image/x-icon", "href": url})
			)

		if self.apple_touch_icon:
			url = static(self.apple_touch_icon)
			tags.append(HTMLTag("link", attrs={
				"rel": "apple-touch-icon",
				"sizes": "400x400",
				"href": url
			}))

		if self.mask_icon:
			url = static(self.mask_icon)
			tags.append(HTMLTag("link", attrs={
				"rel": "mask-icon",
				"href": url,
				"color": "#1d3657"
			}))

		tags += self._link_tags

		if self.canonical_url:
			base_url = self.canonical_url
			tags.append(HTMLTag("meta", attrs={"property": "og:url", "content": self.canonical_url}))
			tags.append(HTMLTag("link", attrs={"rel": "canonical", "href": self.canonical_url}))
		else:
			base_url = self.request.build_absolute_uri(self.request.get_full_path())

		url = urlparse(base_url)
		query_dict = QueryDict(url.query, mutable=True)
		for language_code, _ in settings.LANGUAGES:
			loc_url = url
			query_dict["hl"] = language_code
			if self.hreflang:
				hreflang = self.hreflang(language_code)
				base_url = self.request.build_absolute_uri(hreflang)
				loc_url = urlparse(base_url)
			loc_url = loc_url._replace(query=query_dict.urlencode())
			tags.append(HTMLTag("link", attrs={
				"rel": "alternate", "hreflang": language_code, "href": loc_url.geturl()
			}))

		del query_dict["hl"]
		url = url._replace(query=query_dict.urlencode())
		tags.append(HTMLTag("link", attrs={
			"rel": "alternate", "hreflang": "x-default", "href": url.geturl(),
		}))

		for k, v in self.opengraph.items():
			tags.append(HTMLTag("meta", attrs={"property": k, "content": v}))

		if self.base_title:
			tags.append(HTMLTag("meta", attrs={
				"name": "apple-mobile-web-app-title",
				"content": self.base_title
			}))

		tags += self._script_tags

		return tags

	def get_title(self):
		title_parts = []
		if self.title:
			title_parts.append(str(self.title))
		if self.base_title:
			title_parts.append(str(self.base_title))

		if title_parts:
			return " - ".join(title_parts)
		else:
			return ""

	def add_link(self, **attrs):
		self._link_tags.append(HTMLTag("link", attrs=attrs))

	def add_script(self, content="", **attrs):
		if content is None:
			# a self-closing script tag is always invalid
			content = ""
		self._script_tags.append(HTMLTag("script", attrs=attrs, content=content))

	def add_meta(self, *tags):
		for attrs in tags:
			self._meta_tags.append(HTMLTag("meta", attrs=attrs))

	def add_stylesheets(self, *stylesheets):
		for stylesheet in stylesheets:
			if isinstance(stylesheet, dict):
				attrs = dict(stylesheet)
				attrs.setdefault("rel", "stylesheet")
				attrs.setdefault("type", "text/css")
				if "integrity" in stylesheet:
					attrs.setdefault("crossorigin", "anonymous")
			else:
				attrs = {"rel": "stylesheet", "href": stylesheet, "type": "text/css"}

			if not attrs["href"].startswith(("http:", "https:")):
				attrs["href"] = static(attrs["href"])

			self.add_link(**attrs)

	def add_opensearch(self, href, title, type="application/opensearchdescription+xml"):
		self.add_link(rel="search", type=type, href=static(href), title=title)

	def set_canonical_url(self, url):
		self.canonical_url = self.request.build_absolute_uri(url)

	def set_hreflang(self, callback):
		self.hreflang = callback


class RequestMetaMixin:
	def get(self, request, *args, **kwargs):
		if hasattr(self, "stylesheets"):
			self.request.head.add_stylesheets(*self.stylesheets)
		if hasattr(self, "scripts"):
			for script in self.scripts:
				self.request.head.add_script("", src=script)
		if hasattr(self, "title"):
			self.request.head.title = self.title
		if hasattr(self, "description"):
			self.request.head.add_meta(
				{"name": "description", "content": self.description},
				{"property": "og:description", "content": self.description},
			)
		return super().get(request, *args, **kwargs)
