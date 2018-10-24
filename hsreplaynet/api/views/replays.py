import json
from types import GeneratorType

from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import StreamingHttpResponse
from hearthstone import enums
from rest_framework import fields, renderers, serializers, views
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.utils import encoders

from hsreplaynet.api.permissions import UserHasFeature
from hsreplaynet.games.models.dynamodb import GameReplay

from ..fields import IntEnumField, TimestampField
from ..serializers.replays import GameReplaySerializer


class GameReplayView(views.APIView):
	serializer_class = GameReplaySerializer

	def get(self, request, shortid, **kwargs):
		results = GameReplay.short_id_index.query(shortid)
		try:
			index = results.next()
		except StopIteration:
			raise NotFound()

		replay = GameReplay.get(index.user_id, index.match_start)
		serializer = self.serializer_class(instance=replay)
		return Response(serializer.data)


class StreamingJSONRenderer(renderers.BaseRenderer):
	media_type = "application/json"
	format = "json"
	encoder_class = encoders.JSONEncoder

	def render(self, data, accepted_media_type=None, renderer_context=None):
		if data is None:
			yield "[]"
			return

		if not isinstance(data, GeneratorType) and not isinstance(data, list):
			yield json.dumps(data, cls=self.encoder_class)
			return

		yield "["
		try:
			is_first = True
			for item in data:
				if not is_first:
					yield ","
				else:
					is_first = False
				yield json.dumps(item, cls=self.encoder_class)
		except (Exception) as e:
			yield "]"
			raise e
		else:
			yield "]"


class GameReplayRequestSerializer(serializers.Serializer):
	user_id = fields.IntegerField()
	start_date = TimestampField(precision=1000, required=False, default=None)
	end_date = TimestampField(precision=1000, required=False, default=None)
	game_type = IntEnumField(enums.BnetGameType, required=False, default=None)

	def validate(self, data):
		START_DATE_FIELD = "start_date"
		END_DATE_FIELD = "end_date"
		if data[START_DATE_FIELD] is not None and data[END_DATE_FIELD] is not None:
			if data[START_DATE_FIELD] > data[END_DATE_FIELD]:
				msg = "%s must be before %s." % (START_DATE_FIELD, END_DATE_FIELD)
				raise serializers.ValidationError(msg)
		return data


def _stream_replays(
	user_id, start_date=None, end_date=None, game_type=None,
	serializer_class=GameReplaySerializer
):
	range_key_condition = None
	if start_date is not None and end_date is not None:
		range_key_condition = GameReplay.match_start.between(start_date, end_date)
	else:
		if start_date is not None:
			range_key_condition = GameReplay.match_start > start_date
		if end_date is not None:
			range_key_condition = GameReplay.match_start < end_date

	filter_condition = None
	if game_type is not None:
		filter_condition = GameReplay.game_type == game_type

	for replay in GameReplay.query(
		user_id,
		range_key_condition=range_key_condition,
		filter_condition=filter_condition,
		page_size=settings.DYNAMODB_GAME_REPLAY_PAGE_SIZE
	):
		serializer = serializer_class(instance=replay)
		yield serializer.data


class GameReplayListView(views.APIView):
	authentication_classes = (SessionAuthentication, )
	permission_classes = (IsAuthenticated, UserHasFeature("dynamodb-replays-api"))
	renderer_classes = (StreamingJSONRenderer,)
	serializer_class = GameReplayRequestSerializer

	def get(self, request, **kwargs):
		input = self.serializer_class(data=request.query_params)
		input.is_valid(raise_exception=True)

		User = get_user_model()
		try:
			user = User.objects.get(id=input.validated_data["user_id"])
		except User.DoesNotExist:
			raise NotFound()

		replays = _stream_replays(
			user_id=user.id,
			start_date=input.validated_data["start_date"],
			end_date=input.validated_data["end_date"],
			game_type=input.validated_data["game_type"],
		)

		return StreamingHttpResponse(
			request.accepted_renderer.render(replays),
			content_type=request.accepted_renderer.media_type
		)
