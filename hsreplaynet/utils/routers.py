from django.conf import settings


class UploadEventsRouter:
	"""
	A Django DB Router for interacting with the HSReplay.net uploads-db
	"""

	def db_for_read(self, model, **hints):
		uploads_db = getattr(settings, "UPLOADS_DB", None)

		if model._meta.app_label == "uploads" and uploads_db and uploads_db in settings.DATABASES:
			return uploads_db
		else:
			return "default"

	def db_for_write(self, model, **hints):
		uploads_db = getattr(settings, "UPLOADS_DB", None)

		if model._meta.app_label == "uploads" and uploads_db and uploads_db in settings.DATABASES:
			return uploads_db
		else:
			return "default"

	def allow_relation(self, obj1, obj2, **hints):
		if obj1._meta.app_label == "uploads" or obj2._meta.app_label == "uploads":
			# Models within the uploads-db can have relationships with each other
			return obj1._meta.app_label == obj2._meta.app_label

		return None

	def allow_migrate(self, db, app_label, model_name=None, **hints):
		uploads_db = getattr(settings, "UPLOADS_DB", None)
		if uploads_db and db == uploads_db:
			return app_label == "uploads"

		return None
