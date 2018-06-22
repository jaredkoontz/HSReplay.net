import json
from datetime import date, timedelta

from django import template
from django.conf import settings
from django.core.serializers.json import DjangoJSONEncoder
from django.urls import reverse
from django.utils.safestring import mark_safe


register = template.Library()


@register.filter(name="json", is_safe=True)
def _json(data):
	"""
	Output the json encoding of its argument.
	This will escape all the HTML/XML special characters with their unicode
	escapes, so it is safe to be output anywhere except for inside a tag
	attribute.
	If the output needs to be put in an attribute, entitize the output of this
	filter.
	"""
	json_str = json.dumps(data, cls=DjangoJSONEncoder)

	# Escape all the XML/HTML special characters.
	escapes = ["<", ">", "&"]
	for c in escapes:
		json_str = json_str.replace(c, r"\u%04x" % (ord(c)))

	return mark_safe(json_str)


@register.filter(is_safe=True)
def htmltime(datetime, fmt="%B %d, %Y"):
	iso = datetime.isoformat()
	formatted = datetime.strftime(fmt)
	html = '<time datetime="%s">%s</time>' % (iso, formatted)
	return mark_safe(html)


@register.simple_tag
def joust_static(path):
	return settings.JOUST_STATIC_URL + path


@register.simple_tag
def setting(name):
	return getattr(settings, name, "")


@register.simple_tag(takes_context=True)
def nav_active(context, name, css="active"):
	request = context.request
	if request.path == reverse(name):
		return mark_safe(f' class="{css}"')
	return ""


@register.filter
def pretty_card(source):
	from djstripe.models import Card, PaymentMethod, Source

	if isinstance(source, PaymentMethod):
		try:
			source = source.resolve()
		except Card.DoesNotExist:
			return "(invalid card)"

	if isinstance(source, Card):
		brand = source.brand
		last4 = source.last4
	elif isinstance(source, Source):
		if source.type != "card":
			return str(source)

		brand = source.source_data["brand"]
		last4 = source.source_data["last4"]

	return f"{brand} •••• {last4}"


@register.filter
def last_used(time):
	"""
	Formats a datetime to give a very rough ago estimate.
	It intentionally resolves no less than a week, as it's used for access tokens
	and we can only determine their usage by knowing they expire after 24 hours.
	"""
	difference = date.today() - time.date()
	if difference > timedelta(days=365):
		return "more than a year ago"
	if difference > timedelta(days=31 * 6):
		return "within the last year"
	if difference > timedelta(days=31):
		return "within the last %d months" % ((difference.days - 1) // 31 + 1)
	if difference > timedelta(days=7):
		return "within the last %d weeks" % ((difference.days - 1) // 7 + 1)
	return "within the last week"
