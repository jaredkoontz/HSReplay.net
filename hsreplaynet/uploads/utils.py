def user_agent_product(user_agent):
	"""Returns the "product" component of the specified user agent string

	Per the format for user agent strings described here
	https://tools.ietf.org/html/rfc7231#section-5.5.3, returns the most significant product
	name component from the specified user agent string, or None if the user agent string
	cannot be parsed.

	Some special casing is done do support user agent strings separated by semicolons
	instead of slashes, as is the case with replays uploaded by ElephantsGuide.

	:param user_agent: The user agent string
	:return: The most significant product name
	"""

	if not isinstance(user_agent, str):
		raise ValueError("User agent must be a string")

	idx = user_agent.find("/")
	if idx == -1:
		idx = user_agent.find(";")

	if idx < 0:
		return user_agent if len(user_agent) > 0 else None
	elif idx == 0:
		return None

	return user_agent[:idx]
