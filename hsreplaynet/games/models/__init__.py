from math import ceil

from django.conf import settings
from django.db import models
from django.dispatch.dispatcher import receiver
from django.urls import reverse
from django_intenum import IntEnumField
from hearthstone.enums import BnetGameType, FormatType, PlayState

from hearthsim.identity.accounts.models import AuthToken, Visibility
from hsreplaynet.utils.fields import PlayerIDField, ShortUUIDField
from hsreplaynet.utils.synchronization import acquire_redshift_lock, release_redshift_lock


def _generate_upload_path(shortid):
	return "replays/%s.hsreplay.xml" % (shortid)


def generate_upload_path(instance, filename):
	return _generate_upload_path(instance.shortid)


class GlobalGame(models.Model):
	"""
	Represents a globally unique game (e.g. from the server's POV).

	The fields on this object represent information that is public
	to all players and spectators. When the same game is uploaded
	by multiple players or spectators they will all share a
	reference to a single global game.

	When a replay or raw log file is uploaded the server first checks
	for the existence of a GlobalGame record. It looks for any games
	that occured on the same region where both players have matching
	battle_net_ids and where the match start timestamp is within +/- 1
	minute from the timestamp on the upload.
	The +/- range on the match start timestamp is to account for
	potential clock drift between the computer that generated this
	replay and the computer that uploaded the earlier record which
	first created the GlobalGame record. If no existing GlobalGame
	record is found, then one is created.
	"""

	id = models.BigAutoField(primary_key=True)

	# We believe game_id is not monotonically increasing as it appears
	# to roll over and reset periodically.
	game_handle = models.IntegerField(
		"Game handle",
		null=True, blank=True,
		help_text="Game ID on the Battle.net server"
	)
	server_address = models.GenericIPAddressField(null=True, blank=True)
	server_port = models.IntegerField(null=True, blank=True)
	server_version = models.IntegerField(null=True, blank=True)

	build = models.PositiveIntegerField(
		null=True, blank=True,
		help_text="Hearthstone build number the game was played on."
	)

	match_start = models.DateTimeField(null=True, db_index=True)
	match_end = models.DateTimeField(null=True)

	game_type = IntEnumField("Game type", enum=BnetGameType, null=True, blank=True)
	format = IntEnumField("Format type", enum=FormatType, default=FormatType.FT_UNKNOWN)

	# ladder_season is nullable since not all games are ladder games
	ladder_season = models.IntegerField(
		"Ladder season", null=True, blank=True,
		help_text="The season as calculated from the match start timestamp."
	)

	# Nullable, since not all replays are TBs.
	# Will currently have no way to calculate this so it will always be null for now.
	brawl_season = models.IntegerField(
		"Tavern Brawl season", default=0,
		help_text="The brawl season which increments every time the brawl changes."
	)

	# Nullable, We currently have no way to discover this.
	scenario_id = models.IntegerField(
		"Scenario ID", null=True, blank=True, db_index=True,
		help_text="ID from DBF/SCENARIO.xml or Scenario cache",
	)

	# The following basic stats are globally visible to all
	num_turns = models.IntegerField(null=True, blank=True)
	num_entities = models.IntegerField(null=True, blank=True)

	tainted_decks = models.NullBooleanField()

	digest = models.CharField(
		max_length=40, unique=True, null=True,
		help_text="SHA1 of str(game_handle), str(server_address), str(lo1), str(lo2)"
	)
	loaded_into_redshift = models.DateTimeField(null=True)

	class Meta:
		ordering = ("-match_start", )

	@property
	def exclude_from_statistics(self):
		return any(map(lambda r: r.user and r.user.exclude_from_statistics, self.replays.all()))

	def __str__(self):
		return " vs ".join(str(p) for p in self.players.all())

	@property
	def duration(self):
		return self.match_end - self.match_start

	@property
	def is_ranked(self):
		return self.game_type in (
			BnetGameType.BGT_RANKED_WILD,
			BnetGameType.BGT_RANKED_STANDARD,
		)

	@property
	def is_casual(self):
		return self.game_type in (
			BnetGameType.BGT_CASUAL_WILD,
			BnetGameType.BGT_CASUAL_STANDARD,
		)

	@property
	def is_tavern_brawl(self):
		return self.game_type in (
			BnetGameType.BGT_TAVERNBRAWL_PVP,
			BnetGameType.BGT_TAVERNBRAWL_1P_VERSUS_AI,
			BnetGameType.BGT_TAVERNBRAWL_2P_COOP,
		)

	@property
	def num_own_turns(self):
		return ceil(self.num_turns / 2)

	@property
	def format_friendly_name(self):
		# TODO(i18n): Port to TS
		if self.is_ranked:
			if self.format == FormatType.FT_STANDARD:
				return "Ranked - Standard"
			elif self.format == FormatType.FT_WILD:
				return "Ranked - Wild"
			return "Ranked"
		elif self.is_casual:
			if self.format == FormatType.FT_STANDARD:
				return "Casual - Standard"
			elif self.format == FormatType.FT_WILD:
				return "Casual - Wild"
			return "Casual"
		elif self.is_tavern_brawl:
			return "Tavern Brawl"
		elif self.game_type == BnetGameType.BGT_ARENA:
			return "Arena"
		elif self.game_type == BnetGameType.BGT_FRIENDS:
			return "Friendly Match"
		return ""

	def acquire_redshift_lock(self):
		if not self.id:
			raise RuntimeError("Cannot claim lock on unsaved instances.")
		return acquire_redshift_lock([self.id])

	def release_redshift_lock(self):
		if not self.id:
			raise RuntimeError("Cannot release lock on unsaved instances.")
		return release_redshift_lock([self.id])


class GlobalGamePlayer(models.Model):
	id = models.BigAutoField(primary_key=True)
	game = models.ForeignKey(GlobalGame, on_delete=models.CASCADE, related_name="players")

	name = models.CharField("Player name", blank=True, max_length=64, db_index=True)

	player_id = PlayerIDField(blank=True)
	pegasus_account = models.ForeignKey("accounts.BlizzardAccount", on_delete=models.PROTECT)
	is_ai = models.BooleanField(
		"Is AI", default=False,
		help_text="Whether the player is an AI.",
	)
	is_first = models.BooleanField(
		"Is first player",
		help_text="Whether the player is the first player",
	)

	hero = models.ForeignKey("cards.Card", to_field="card_id", on_delete=models.PROTECT)
	hero_premium = models.BooleanField(
		"Hero Premium", default=False,
		help_text="Whether the player's initial hero is golden."
	)

	final_state = IntEnumField(
		"Final State", enum=PlayState, default=PlayState.INVALID,
	)
	extra_turns = models.SmallIntegerField(
		null=True, help_text="Extra turns taken by the player this game (Time Warp)."
	)

	deck_list = models.ForeignKey(
		"decks.Deck", on_delete=models.PROTECT,
		help_text="As much as is known of the player's starting deck list."
	)

	# Game type metadata

	rank = models.SmallIntegerField(
		"Rank", null=True, blank=True,
		help_text="1 through 25, or 0 for legend.",
	)
	legend_rank = models.PositiveIntegerField(null=True, blank=True)
	stars = models.PositiveSmallIntegerField(null=True, blank=True)
	wins = models.PositiveIntegerField(
		"Wins", null=True, blank=True,
		help_text="Number of wins in the current game mode (eg. ladder season, arena key...)",
	)
	losses = models.PositiveIntegerField(
		"Losses", null=True, blank=True,
		help_text="Number of losses in the current game mode (current season)",
	)
	deck_id = models.BigIntegerField("Deck ID", null=True, blank=True)
	cardback_id = models.IntegerField("Cardback ID", null=True, blank=True)

	class Meta:
		unique_together = ("game", "player_id")

	def __str__(self):
		return self.name

	@property
	def won(self):
		return self.final_state in (PlayState.WINNING, PlayState.WON)

	@property
	def opponent(self):
		opponent_id = 2 if self.player_id == 1 else 2
		try:
			player = GlobalGamePlayer.objects.get(game=self.game_id, player_id=opponent_id)
		except GlobalGamePlayer.DoesNotExist:
			player = None
		return player

	@property
	def anonymous_name(self):
		if "#" in self.name:
			return self.name.split("#")[0]
		return self.name

	@property
	def hero_class_name(self):
		return self.hero.card_class.name


class GameReplayManager(models.Manager):
	def live(self):
		return self.filter(is_deleted=False)

	def find_by_short_id(self, shortid):
		"""Fetch a game replay by its ShortID

		If the ShortID is an alias it will get resolved and the replay will be returned.

		Returns None if a replay cannot be found.
		"""
		try:
			return GameReplay.objects.get(shortid=shortid)
		except GameReplay.DoesNotExist:
			try:
				return ReplayAlias.objects.get(shortid=shortid)
			except ReplayAlias.DoesNotExist:
				pass


class GameReplay(models.Model):
	"""
	Represents a replay as captured from the point of view of a single
	packet stream sent to a Hearthstone client.

	Replays can be uploaded by either of the players or by any number
	of spectators who watched the match. It is possible
	that the same game could be uploaded from multiple points of view.
	When this happens each GameReplay will point
	to the same GlobalGame record via the global_game foreign key.

	It is possible that different uploads of the same game will have
	different information in them.
	For example:
	- If Player A and Player B are Real ID Friends and Player C is
	Battle.net friends with just Player B, then when Player C spectates
	a match between Players A and B, his uploaded replay will show the
	BattleTag as the name of Player A. However if Player B uploads a
	replay of the same match, his replay will show the real name for
	Player A.

	- Likewise, if Player C either starts spectating the game after it has
	already begun or stops spectating before it ends, then his uploaded
	replay will have fewer turns of gameplay then Player B's replay.
	"""

	class Meta:
		# ordering = ("global_game", )
		# Ordering on global_game causes nasty inner joins.
		# We order by descending ID instead for now, until we have an upload_date.
		ordering = ("-id", )

		# Replays are unique to a perspective on the game (global_game):
		# - client_handle: the *same* client cant be used for multiple replays
		# - reconnecting: We do not currently unify games where the player reconnects
		# - friendly_player_id: Unique across a client_handle and a spectator_mode
		unique_together = (
			"global_game", "client_handle", "friendly_player_id",
			"spectator_mode", "reconnecting"
		)

	id = models.BigAutoField(primary_key=True)
	shortid = ShortUUIDField("Short ID")
	upload_token = models.ForeignKey(
		AuthToken, on_delete=models.SET_NULL, null=True, blank=True, related_name="replays"
	)
	user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.SET_NULL, null=True, blank=True, related_name="replays"
	)
	global_game = models.ForeignKey(
		GlobalGame, on_delete=models.CASCADE, related_name="replays",
		help_text="References the single global game that this replay shows."
	)

	# The "friendly player" is the player whose cards are at the bottom of the
	# screen when watching a game. For spectators this is determined by which
	# player they started spectating first (if they spectate both).
	friendly_player_id = PlayerIDField(
		"Friendly PlayerID",
		null=True, help_text="PlayerID of the friendly player (1 or 2)",
	)

	# When serving replay data in the security context of the user who uploaded this replay
	# this deck list should be used for the opponent, so as to avoid revealing unplayed cards
	# in the opponent's deck, which we might know in the case where multiple uploads were
	# unified. If the other uploader has set their replay visibility to private, then we cannot
	# leak the cards in their deck, via the globalgameplayer.
	opponent_revealed_deck = models.ForeignKey(
		"decks.Deck", on_delete=models.PROTECT,
		null=True,
		help_text="As much as is known of the opponent's starting deck list."
	)

	# This is useful to know because replays that are spectating both players
	# will have more data then those from a single player.
	# For example, they will have access to the cards that are in each players hand.
	# This is detectable from the raw logs, although we currently intend to have
	# the client uploading the replay provide it.
	spectator_mode = models.BooleanField(default=False)
	spectator_password = models.CharField("Spectator Password", max_length=16, blank=True)
	client_handle = models.IntegerField(null=True, blank=True)
	aurora_password = models.CharField(max_length=16, blank=True)

	build = models.PositiveIntegerField("Hearthstone Build", null=True, blank=True)

	replay_xml = models.FileField(upload_to=generate_upload_path)
	hsreplay_version = models.CharField(
		"HSReplay library version",
		max_length=16, help_text="The HSReplay library version used to generate the replay",
	)
	hslog_version = models.CharField(
		"hslog library version",
		max_length=24, help_text="The python-hearthstone library version at processing",
		null=True,  # TODO: Remove this once the table is clean of NULLs
	)
	user_agent = models.CharField(max_length=100, null=True, help_text="Uploader User-Agent")

	# The fields below capture the preferences of the user who uploaded it.
	is_deleted = models.BooleanField(
		"Soft deleted",
		default=False, help_text="Indicates user request to delete the upload"
	)

	won = models.NullBooleanField()
	disconnected = models.BooleanField(default=False)
	reconnecting = models.BooleanField(
		"Is reconnecting", default=False,
		help_text="Whether the player is reconnecting to an existing game",
	)
	resumable = models.NullBooleanField()

	visibility = IntEnumField(enum=Visibility, default=Visibility.Public)
	hide_player_names = models.BooleanField(default=False)

	views = models.PositiveIntegerField(default=0)
	objects = GameReplayManager()

	def __str__(self):
		return str(self.global_game)

	@property
	def pretty_name(self):
		return self.build_pretty_name()

	@property
	def pretty_name_spoilerfree(self):
		return self.build_pretty_name(spoilers=False)

	@property
	def upload_event_admin_url(self):
		from hsreplaynet.uploads.models import UploadEvent
		# These get garbage collected periodically
		# So this will not exist for old games
		upload_event = UploadEvent.objects.filter(shortid=self.shortid)
		if upload_event.count() > 0:
			return upload_event.first().get_admin_url()
		else:
			return None

	def build_pretty_name(self, spoilers=True, battletags=False):
		players = self.global_game.players.values_list("player_id", "final_state", "name")
		if not battletags:
			players = list(map(lambda p: [p[0], p[1], p[2].split("#")[0]], players))
		if len(players) != 2:
			return "Broken game (%i players)" % (len(players))
		if players[0][0] == self.friendly_player_id:
			friendly, opponent = players
		else:
			opponent, friendly = players
		if spoilers:
			if self.disconnected:
				state = "Disconnected"
			elif self.won:
				state = "Won"
			elif friendly[1] == opponent[1]:
				state = "Tied"
			else:
				state = "Lost"
			return "%s (%s) vs. %s" % (friendly[2], state, opponent[2])
		return "%s vs. %s" % (friendly[2], opponent[2])

	def get_absolute_url(self):
		return reverse("games_replay_view", kwargs={"id": self.shortid})

	def generate_description(self):
		tpl = "Watch a game of Hearthstone between %s (%s) and %s (%s) in your browser."
		players = self.global_game.players.all()
		if len(players) != 2:
			return ""
		player1, player2 = players[0], players[1]
		return tpl % (
			player1.anonymous_name, player1.hero.card_class.name.capitalize(),
			player2.anonymous_name, player2.hero.card_class.name.capitalize()
		)

	def player(self, number):
		for player in self.global_game.players.all():
			if player.player_id == number:
				return player

	@property
	def friendly_player(self):
		return self.global_game.players.get(player_id=self.friendly_player_id)

	@property
	def friendly_deck(self):
		return self.friendly_player.deck_list

	@property
	def opposing_player(self):
		return self.global_game.players.exclude(player_id=self.friendly_player_id).get()

	@property
	def opposing_deck(self):
		return self.opponent_revealed_deck

	@property
	def region(self):
		return self.friendly_player.pegasus_account.region

	def serialize(self):
		from ..processing import get_replay_url
		from ..serializers import GameReplaySerializer

		s = GameReplaySerializer(self)
		serialized = s.data
		serialized["url"] = get_replay_url(self.shortid)

		return serialized


class ReplayAlias(models.Model):
	"""
	Replay aliases are alternative shortids that reference the same GameReplay.

	Each time a power.log is uploaded it is assigned a distinct ShortID. However, if that
	power.log is a duplicate then instead of creating an additional GameReplay, we create
	a ReplayAlias for that ShortID which can be used to lookup the game replay.
	"""

	id = models.BigAutoField(primary_key=True)
	shortid = ShortUUIDField("Short ID")
	replay = models.ForeignKey(GameReplay, on_delete=models.CASCADE, related_name="aliases")

	def get_absolute_url(self):
		return self.replay.get_absolute_url()


@receiver(models.signals.post_delete, sender=GameReplay)
def cleanup_hsreplay_file(sender, instance, **kwargs):
	from hsreplaynet.utils import delete_file
	file = instance.replay_xml
	if file.name:
		delete_file(file.name)
