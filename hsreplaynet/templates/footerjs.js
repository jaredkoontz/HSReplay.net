{% load web_extras %}
{% if request.dnt %}
// You are sending DNT. We won't serve you Google Analytics or Ads.
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
{% endif %}

{% endif %}
