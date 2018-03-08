import datetime

from oauth2_provider.generators import BaseHashGenerator
from oauthlib.common import UNICODE_ASCII_CHARACTER_SET, generate_client_id


class ClientIdGenerator(BaseHashGenerator):
	def hash(self):
		return generate_client_id(length=24, chars=UNICODE_ASCII_CHARACTER_SET)


class ClientSecretGenerator(BaseHashGenerator):
	def hash(self):
		datestamp = datetime.date.today().isoformat().replace("-", "")
		return datestamp + generate_client_id(length=24, chars=UNICODE_ASCII_CHARACTER_SET)
