{% load web_extras %}
{% load get_current_language from i18n %}
{% load feature from features %}
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
ga("set", "dimension1", "{% get_current_language as lang %}{{ lang }}");
ga("set", "dimension2", "{% if premium %}Premium Subscriber{% else %}Free User{% endif %}");
ga("set", "dimension3", "{% if user.is_authenticated %}Authenticated{% else %}Anonymous{% endif %}");
ga("send", "pageview", {
	page: location.pathname,
});
{% endif %}
{% feature "facebook-pixel" as pixelft %}
{% setting "FACEBOOK_PIXEL" as fbpixel %}
{% if pixelft.enabled and fbpixel %}
{% if not premium or just_subscribed %}
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
	n.callMethod.apply(n,arguments):n.queue.push(arguments)};
	if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";
	n.queue=[];t=b.createElement(e);t.async=!0;
	t.src=v;s=b.getElementsByTagName(e)[0];
	s.parentNode.insertBefore(t,s)}(window,document,"script",
	"https://connect.facebook.net/en_US/fbevents.js");
fbq("init", "{{ fbpixel }}");
{% endif %}
{% endif %}

{% endif %}
