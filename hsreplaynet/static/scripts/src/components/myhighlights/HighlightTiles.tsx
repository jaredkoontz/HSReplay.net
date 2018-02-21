import React from "react";
import CardData from "../../CardData";
import { TableData } from "../../interfaces";
import CardHighlightTile from "../CardHighlightTile";

interface Props {
	cardData?: CardData;
	cardStats?: TableData;
	ranks?: TableData;
}

export default class HighlightTiles extends React.Component<Props> {
	getCard(dbfId: number): any {
		return this.props.cardData.fromDbf(dbfId || 1674);
	}

	public render(): React.ReactNode {
		const max = {
			damage_done: {},
			healing_done: {},
			times_played: {},
			minions_killed: {},
			heroes_killed: {},
			num_distinct_decks: {},
			win_rate: {}
		};
		const maxKeys = Object.keys(max);
		const cards = this.props.cardStats.series.data.ALL;
		cards.forEach(card => {
			maxKeys.forEach(key => {
				const current = max[key][key];
				if ((!current || card[key] > current) && card[key]) {
					max[key] = card;
				}
			});
		});
		const gameCounts = { num_standard_games: 0, num_wild_games: 0 };
		const rank = {
			best_standard_rank: undefined,
			best_wild_rank: undefined
		};
		const legendRank = {
			best_standard_legend_rank: undefined,
			best_wild_legend_rank: undefined
		};
		const seasons = this.props.ranks.series.data.ALL;
		seasons.forEach(season => {
			Object.keys(gameCounts).forEach(
				key => (gameCounts[key] += season[key])
			);
			Object.keys(rank).forEach(key => {
				if ((!rank[key] || season[key] < rank[key]) && season[key]) {
					rank[key] = season[key];
				}
			});
			Object.keys(legendRank).forEach(key => {
				if (
					(!legendRank[key] || season[key] < legendRank[key]) &&
					season[key]
				) {
					legendRank[key] = season[key];
				}
			});
		});

		const makeRank = (rank: number, legend: number): string => {
			if (legend) {
				return "Legend " + legend;
			}
			if (rank) {
				return "Rank " + rank;
			}
			return "Unranked";
		};

		const maxStandardRank = makeRank(
			legendRank.best_standard_legend_rank,
			rank.best_standard_rank
		);
		const maxWildRank = makeRank(
			legendRank.best_wild_legend_rank,
			rank.best_wild_rank
		);
		return (
			<div>
				<CardHighlightTile
					card={this.getCard(2053)}
					title="Highest rank | Standard"
					value={maxStandardRank}
					name={(gameCounts.num_standard_games || "No") + " games"}
				/>
				<CardHighlightTile
					card={this.getCard(38526)}
					title="Highest rank | Wild"
					value={maxWildRank}
					name={(gameCounts.num_wild_games || "No") + " games"}
				/>
				<CardHighlightTile
					card={this.getCard(max.damage_done["dbf_id"])}
					title="Most damage done"
					value={max.damage_done["damage_done"] || 0}
				/>
				<CardHighlightTile
					card={this.getCard(max.healing_done["dbf_id"])}
					title="Most healing done"
					value={max.healing_done["healing_done"] || 0}
				/>
				<CardHighlightTile
					card={this.getCard(max.times_played["dbf_id"])}
					title="Most played"
					value={(max.times_played["times_played"] || 0) + " times"}
				/>
				<CardHighlightTile
					card={this.getCard(max.minions_killed["dbf_id"])}
					title="Most minions killed"
					value={max.minions_killed["minions_killed"] || 0}
				/>
				<CardHighlightTile
					card={this.getCard(max.heroes_killed["dbf_id"])}
					title="Most heroes killed"
					value={max.heroes_killed["heroes_killed"] || 0}
				/>
				<CardHighlightTile
					card={this.getCard(max.num_distinct_decks["dbf_id"])}
					title="Most versatile"
					value={
						"in " +
						(max.num_distinct_decks["num_distinct_decks"] || 0) +
						" decks"
					}
				/>
				<CardHighlightTile
					card={this.getCard(max.win_rate["dbf_id"])}
					title="Highest winrate"
					value={
						(max.win_rate["win_rate"] &&
							max.win_rate["win_rate"] + "%") ||
						"-"
					}
				/>
			</div>
		);
	}
}
