{% load web_extras %}
{% load get_current_language from i18n %}
{% if request.dnt %}
// You are sending DNT. We won't serve you Analytics.
{% else %}
{% setting "GOOGLE_ANALYTICS" as gua %}
{% if gua %}
(function(i, s, o, g, r, a, m) {
	i["GoogleAnalyticsObject"] = r;
	i[r] = i[r] || function() {
		(i[r].q = i[r].q || []).push(arguments)
	}, i[r].l = 1 * new Date();
	a = s.createElement(o),
	m = s.getElementsByTagName(o)[0];
	a.async = 1;
	a.src = g;
	m.parentNode.insertBefore(a, m)
})(window, document, "script", "https://www.google-analytics.com/analytics.js", "ga");
ga("create", "{{ gua }}", "auto");
ga("set", "transport", "beacon");
if(typeof _userdata === "object" && typeof _userdata.userid !== "undefined") {
	ga("set", "userId", _userdata.userid);
}
ga("send", "pageview", {
	page: location.pathname,
});
ga("set", "dimension1", "{% get_current_language as lang %}{{ lang }}");
{% endif %}

{% endif %}
