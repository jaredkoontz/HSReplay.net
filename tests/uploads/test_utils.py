from hsreplaynet.uploads.utils import user_agent_product


def test_user_agent_product():
	assert user_agent_product("HDTPortable/1.5.6.3341") == "HDTPortable"
	assert user_agent_product("HSTracker/1.5.1c") == "HSTracker"
	assert user_agent_product("net.mbonnin.arcanetracker/3.04; Android 5.1;") == \
		"net.mbonnin.arcanetracker"
	assert user_agent_product("HDT/1.6.3.3598") == "HDT"


def test_user_agent_product_no_version():
	assert user_agent_product("Hearthstone Deck Tracker") == "Hearthstone Deck Tracker"


def test_user_agent_product_elephants():
	assert user_agent_product("ElephantsGuide; Android; v36") == "ElephantsGuide"


def test_user_agent_product_invalid():
	assert user_agent_product("") is None
	assert user_agent_product("/") is None
	assert user_agent_product(";") is None
