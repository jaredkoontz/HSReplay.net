from django.core.cache import caches
from rest_framework.throttling import SimpleRateThrottle


class PerViewRateThrottle(SimpleRateThrottle):
	cache = caches["throttling"]
	cache_format = "throttle_%(scope)s_%(ident)s_%(view)s"

	def get_view_key(self, view):
		return "%s.%s" % (view.__module__, view.__class__.__name__)


class PerViewUserRateThrottle(PerViewRateThrottle):
	scope = "user"

	def get_cache_key(self, request, view):
		if request.user and request.user.is_authenticated:
			ident = request.user.pk
		else:
			ident = self.get_ident(request)
		return self.cache_format % {
			"scope": self.scope,
			"ident": ident,
			"view": self.get_view_key(view)
		}


class PerViewUserBurstRateThrottle(PerViewUserRateThrottle):
	scope = "per_view_user_burst"


class PerViewUserSustainedRateThrottle(PerViewUserRateThrottle):
	scope = "per_view_user_sustained"


class RedeemCodeRateThrottle(PerViewUserRateThrottle):
	rate = "5/min"
