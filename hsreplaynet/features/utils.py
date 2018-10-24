from .models import Feature


def feature_enabled_for_user(feature_name: str, user) -> bool:

	try:
		feature = Feature.objects.get(name=feature_name)
	except Feature.DoesNotExist:
		return False
	else:
		return feature.enabled_for_user(user)
