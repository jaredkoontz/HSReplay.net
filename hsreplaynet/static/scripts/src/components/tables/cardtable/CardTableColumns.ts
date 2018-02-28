import { TableColumn } from "../Table";

export type CardTableColumnKey =
	| "card"
	| "damageDone"
	| "distinctDecks"
	| "drawnWinrate"
	| "healingDone"
	| "heroesKilled"
	| "includedCount"
	| "includedPopularity"
	| "includedWinrate"
	| "keepPercent"
	| "minionsKilled"
	| "mulliganWinrate"
	| "playedPopularity"
	| "playedWinrate"
	| "playedWinrate"
	| "timesPlayedPersonal"
	| "timesPlayedTotal"
	| "totalGames"
	| "turnPlayed"
	| "turnsInHand"
	| "winrate"
	| "prevalence";

export const cardTableColumnData: {
	[key in CardTableColumnKey]: TableColumn
} = {
	card: {
		dataKey: "card",
		defaultSortDirection: "ascending",
		sortKey: "card",
		text: "Card",
	},
	mulliganWinrate: {
		dataKey: "opening_hand_winrate",
		infoHeader: "Mulligan winrate",
		infoText:
			"Average winrate of games when the card ended up in the opening hand.",
		sortKey: "mulliganWinrate",
		text: "Mulligan WR",
		winrateData: true,
	},
	keepPercent: {
		dataKey: "keep_percentage",
		infoHeader: "Kept",
		infoText:
			"Percentage of times the card was kept when presented during mulligan.",
		percent: true,
		sortKey: "keepPercent",
		text: "Kept",
	},
	drawnWinrate: {
		dataKey: "winrate_when_drawn",
		infoHeader: "Drawn winrate",
		infoText:
			"Average winrate of games where the card was drawn at any point or ended up in the opening hand.",
		sortKey: "drawnWinrate",
		text: "Drawn WR",
		winrateData: true,
	},
	playedWinrate: {
		dataKey: "winrate_when_played",
		infoHeader: "Played winrate",
		infoText:
			"Average winrate of games where the card was played at any point.",
		sortKey: "playedWinrate",
		text: "Played WR",
		winrateData: true,
	},
	turnsInHand: {
		dataKey: "avg_turns_in_hand",
		infoHeader: "Turns held",
		infoText: "Average number of turns the card was held in hand.",
		sortKey: "turnsInHand",
		text: "Turns held",
	},
	turnPlayed: {
		dataKey: "avg_turn_played_on",
		infoHeader: "Turn played",
		infoText: "Average turn the card was played on.",
		sortKey: "turnPlayed",
		text: "Turn played",
	},
	timesPlayedPersonal: {
		dataKey: "times_played",
		infoHeader: "Times played",
		infoText: "Number of times you played the card.",
		sortKey: "timesPlayed",
		text: "Times played",
	},
	damageDone: {
		dataKey: "damage_done",
		infoHeader: "Damage done",
		infoText:
			"Total amount of damage the card has dealt. Does not include overkills.",
		sortKey: "damageDone",
		text: "Damage done",
	},
	healingDone: {
		dataKey: "healing_done",
		infoHeader: "Healing done",
		infoText:
			"Total amount of healing the card has done. Does not include overhealing.",
		sortKey: "healingDone",
		text: "Healing done",
	},
	heroesKilled: {
		dataKey: "heroes_killed",
		infoHeader: "Heroes killed",
		infoText: "Number of heroes the card has killed.",
		sortKey: "heroesKilled",
		text: "Heroes killed",
	},
	minionsKilled: {
		dataKey: "minions_killed",
		infoHeader: "Minions killed",
		infoText: "Number of minions the card has killed.",
		sortKey: "minionsKilled",
		text: "Minions killed",
	},
	totalGames: {
		dataKey: "total_games",
		infoHeader: "Total games",
		infoText:
			"Number of games you played with a deck that included the card.",
		sortKey: "totalGames",
		text: "Total games",
	},
	winrate: {
		dataKey: "winrate",
		infoHeader: "Winrate",
		infoText: "Winrate of decks including the card.",
		sortKey: "winrate",
		text: "Winrate",
		winrateData: true,
	},
	distinctDecks: {
		dataKey: "distinct_decks",
		infoHeader: "Distinct decks",
		infoText: "Number of distinct decks you included the card in.",
		sortKey: "distinctDecks",
		text: "Distinct decks",
	},
	includedPopularity: {
		dataKey: "included_popularity",
		infoHeader: "Included in % of decks",
		infoText:
			"Percentage of decks that include at least one copy of the card.",
		percent: true,
		sortKey: "includedPopularity",
		text: "In % of decks",
	},
	includedCount: {
		dataKey: "included_count",
		infoHeader: "Copies in deck",
		infoText: "Average number of copies in a deck.",
		sortKey: "includedCount",
		text: "Copies",
	},
	includedWinrate: {
		dataKey: "included_winrate",
		infoHeader: "Deck Winrate",
		infoText: "Average winrate of decks that include this card.",
		sortKey: "includedWinrate",
		text: "Deck winrate",
		winrateData: true,
	},
	timesPlayedTotal: {
		dataKey: "times_played",
		infoHeader: "Times played",
		infoText: "Number of times the card was played.",
		prettify: true,
		sortKey: "timesPlayed",
		text: "Times played",
	},
	playedPopularity: {
		dataKey: "played_popularity",
		infoHeader: "% of played cards",
		infoText: "Percentage of all cards played.",
		percent: true,
		sortKey: "timesPlayed",
		text: "% of played cards",
	},
	prevalence: {
		dataKey: "prevalence",
		sortKey: "prevalence",
		text: "Prevalence",
	},
};
