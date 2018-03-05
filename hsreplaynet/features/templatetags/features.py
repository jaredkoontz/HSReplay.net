from django import template

from hsreplaynet.features.models import Feature


register = template.Library()


def get_feature_context(user, feature_name):
	feature_context = {
		"name": feature_name,
		"enabled": True,
		"read_only": False,
		"exists": True,
	}

	try:
		feature = Feature.objects.get(name=feature_name)
	except Feature.DoesNotExist:
		feature_context["exists"] = False
		feature_context["enabled"] = False
	else:
		feature_context["enabled"] = feature.enabled_for_user(user)
		feature_context["read_only"] = feature.read_only

	return feature_context


@register.simple_tag(takes_context=True)
def feature(context, name):
	"""
	Example usage:

	{% feature "billing" as billing %}
	{% if billing.enabled %}
		Your billing data: ...
	{% else %}
		Billing is not available.
	{% endif %}
	"""

	return get_feature_context(context["user"], name)
