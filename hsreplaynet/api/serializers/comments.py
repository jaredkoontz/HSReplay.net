from django_comments.models import Comment
from rest_framework.serializers import HyperlinkedModelSerializer

from .accounts import UserSerializer


class CommentSerializer(HyperlinkedModelSerializer):
	user = UserSerializer()

	class Meta:
		model = Comment
		fields = ("user", "comment", "submit_date")
