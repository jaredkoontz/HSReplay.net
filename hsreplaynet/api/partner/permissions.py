from ..permissions import UserHasFeature


FEATURE = "partner-stats-api"


PartnerStatsPermission = UserHasFeature(FEATURE)
