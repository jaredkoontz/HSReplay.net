import { TableColumn } from "../Table";
import { TranslationFunction } from "i18next";

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
	| "requiredForArchetype"
	| "timesPlayedPersonal"
	| "timesPlayedTotal"
	| "totalGames"
	| "turnPlayed"
	| "turnsInHand"
	| "winrate"
	| "prevalence";

export function getCardTableColumnData(
	t: TranslationFunction,
): { [key in CardTableColumnKey]: TableColumn } {
	return {
		card: {
			dataKey: "card",
			defaultSortDirection: "ascending",
			sortKey: "card",
			text: t("Card"),
		},
		mulliganWinrate: {
			dataKey: "opening_hand_winrate",
			infoHeader: t("Mulligan winrate"),
			infoText: t(
				"Average winrate of games when the card ended up in the opening hand.",
			),
			lowDataKey: "times_in_opening_hand",
			lowDataValue: 100,
			lowDataWarning: t("Low data. Winrate might be inaccurate."),
			sortKey: "mulliganWinrate",
			text: t("Mulligan WR"),
			winrateData: true,
		},
		keepPercent: {
			dataKey: "keep_percentage",
			infoHeader: t("Kept"),
			infoText: t(
				"Percentage of times the card was kept when presented during mulligan.",
			),
			percent: true,
			sortKey: "keepPercent",
			text: t("Kept"),
		},
		drawnWinrate: {
			dataKey: "winrate_when_drawn",
			infoHeader: t("Drawn winrate"),
			infoText: t(
				"Average winrate of games where the card was drawn at any point or ended up in the opening hand.",
			),
			sortKey: "drawnWinrate",
			text: t("Drawn WR"),
			winrateData: true,
		},
		playedWinrate: {
			dataKey: "winrate_when_played",
			infoHeader: t("Played winrate"),
			infoText: t(
				"Average winrate of games where the card was played at any point.",
			),
			sortKey: "playedWinrate",
			text: t("Played WR"),
			winrateData: true,
		},
		requiredForArchetype: {
			dataKey: "required_for_archetype",
			infoHeader: t("Required for archetype"),
			infoText: t(
				"Whether this card is required in order for a deck to be classified as a particular archetype",
			),
			reactNode: true,
			sortKey: "requiredForArchetype",
			text: t("Required?"),
		},
		turnsInHand: {
			dataKey: "avg_turns_in_hand",
			infoHeader: t("Turns held"),
			infoText: t("Average number of turns the card was held in hand."),
			sortKey: "turnsInHand",
			text: t("Turns held"),
		},
		turnPlayed: {
			dataKey: "avg_turn_played_on",
			infoHeader: t("Turn played"),
			infoText: t("Average turn the card was played on."),
			sortKey: "turnPlayed",
			text: t("Turn played"),
		},
		timesPlayedPersonal: {
			dataKey: "times_played",
			infoHeader: t("Times played"),
			infoText: t("Number of times you played the card."),
			sortKey: "timesPlayed",
			text: t("Times played"),
		},
		damageDone: {
			dataKey: "damage_done",
			infoHeader: t("Damage done"),
			infoText: t(
				"Total amount of damage the card has dealt. Does not include overkills.",
			),
			sortKey: "damageDone",
			text: t("Damage done"),
		},
		healingDone: {
			dataKey: "healing_done",
			infoHeader: t("Healing done"),
			infoText: t(
				"Total amount of healing the card has done. Does not include overhealing.",
			),
			sortKey: "healingDone",
			text: t("Healing done"),
		},
		heroesKilled: {
			dataKey: "heroes_killed",
			infoHeader: t("Heroes killed"),
			infoText: t("Number of heroes the card has killed."),
			sortKey: "heroesKilled",
			text: t("Heroes killed"),
		},
		minionsKilled: {
			dataKey: "minions_killed",
			infoHeader: t("Minions killed"),
			infoText: t("Number of minions the card has killed."),
			sortKey: "minionsKilled",
			text: t("Minions killed"),
		},
		totalGames: {
			dataKey: "total_games",
			infoHeader: t("Total games"),
			infoText: t(
				"Number of games you played with a deck that included the card.",
			),
			sortKey: "totalGames",
			text: t("Total games"),
		},
		winrate: {
			dataKey: "winrate",
			infoHeader: t("Winrate"),
			infoText: t("Winrate of decks including the card."),
			sortKey: "winrate",
			text: t("Winrate"),
			winrateData: true,
		},
		distinctDecks: {
			dataKey: "distinct_decks",
			infoHeader: t("Distinct decks"),
			infoText: t("Number of distinct decks you included the card in."),
			sortKey: "distinctDecks",
			text: t("Distinct decks"),
		},
		includedPopularity: {
			dataKey: "included_popularity",
			infoHeader: t("Included in % of decks"),
			infoText: t(
				"Percentage of decks that include at least one copy of this card.",
			),
			percent: true,
			sortKey: "includedPopularity",
			text: t("In % of decks"),
		},
		includedCount: {
			dataKey: "included_count",
			infoHeader: t("Copies in deck"),
			infoText: t("Average number of copies in a deck."),
			sortKey: "includedCount",
			text: t("Copies"),
		},
		includedWinrate: {
			dataKey: "included_winrate",
			infoHeader: t("Deck winrate"),
			infoText: t("Average winrate of decks that include this card."),
			sortKey: "includedWinrate",
			text: t("Deck winrate"),
			winrateData: true,
		},
		timesPlayedTotal: {
			dataKey: "times_played",
			infoHeader: t("Times played"),
			infoText: t("Number of times the card was played."),
			prettify: true,
			sortKey: "timesPlayed",
			text: t("Times played"),
		},
		playedPopularity: {
			dataKey: "played_popularity",
			infoHeader: t("% of played cards"),
			infoText: t("Percentage of all cards played."),
			percent: true,
			sortKey: "timesPlayed",
			text: t("% of played cards"),
		},
		prevalence: {
			dataKey: "prevalence",
			sortKey: "prevalence",
			text: t("Prevalence"),
		},
	};
}
