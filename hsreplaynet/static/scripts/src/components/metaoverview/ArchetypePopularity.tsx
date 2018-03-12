import React from "react";
import {
	ApiArchetypeRankPopularity,
	ArchetypeRankData,
	ArchetypeRankPopularity,
	SortDirection,
} from "../../interfaces";
import CardData from "../../CardData";
import { withLoading } from "../loading/Loading";
import PopularityMatrix from "./popularity/PopularityMatrix";
import { getOtherArchetype } from "../../helpers";
import { Archetype } from "../../utils/api";

interface Props {
	archetypeData?: any;
	cardData: CardData;
	gameType: string;
	popularityData?: any;
	sortDirection?: SortDirection;
	setSortDirection?: (ascending: SortDirection) => void;
	sortBy?: string;
	setSortBy?: (prop: string) => void;
}

class ArchetypePopularity extends React.Component<Props> {
	public render(): React.ReactNode {
		const archetypeData: ArchetypeRankPopularity[] = [];
		const archetypes = this.getAllArchetypes();
		const popularityData = this.props.popularityData.series.data;
		const metaData = this.props.popularityData.series.metadata;
		let maxPopularity = 0;

		const games = [];
		let maxGames = 0;
		let numRanks = 0;
		const ranks = Object.keys(metaData);
		ranks.forEach(rank => {
			if (+rank > 20) {
				return;
			}
			numRanks++;
			const totalGames = metaData[rank].total_games;
			if (totalGames > maxGames) {
				maxGames = totalGames;
			}
			games[+rank] = totalGames;
		});

		archetypes.forEach((archetype: Archetype) => {
			const rankData: ArchetypeRankData[] = [];

			let totalPopularity = 0;
			let totalGames = 0;

			Object.keys(popularityData).forEach((rank: string) => {
				if (+rank > 20) {
					return;
				}
				const data = popularityData[rank].find(pData => {
					return pData.archetype_id === archetype.id;
				});
				if (data) {
					if (data.pct_of_rank > maxPopularity && data.rank <= 20) {
						maxPopularity = data.pct_of_rank;
					}
					totalPopularity += data.pct_of_rank * data.total_games;
					totalGames += data.total_games;
				}
				rankData.push({
					archetypeId: archetype.id,
					archetypeName: archetype.name,
					playerClass: archetype.player_class_name,
					popularityAtRank: (data && data.pct_of_rank) || 0,
					rank: +rank,
					totalGames: (data && data.total_games) || 0,
					winrate: (data && data.win_rate) || 0,
				});
			});

			totalPopularity =
				Math.round(totalPopularity / (totalGames / 100)) / 100;

			archetypeData.push({
				id: archetype.id,
				rankData,
				name: archetype.name,
				playerClass: archetype.player_class_name,
				totalPopularity,
			});
		});

		this.sortArchetypes(archetypeData);

		return (
			<PopularityMatrix
				archetypes={archetypeData}
				cardData={this.props.cardData}
				games={games}
				gameType={this.props.gameType}
				maxGames={maxGames}
				maxPopuarity={maxPopularity}
				sortBy={this.props.sortBy}
				sortDirection={this.props.sortDirection}
				onSortChanged={(
					sortBy: string,
					sortDirection: SortDirection,
				) => {
					this.props.setSortDirection(sortDirection);
					this.props.setSortBy(sortBy);
				}}
				numRanks={numRanks}
			/>
		);
	}

	sortArchetypes(archetypes: ArchetypeRankPopularity[]) {
		const direction = this.props.sortDirection === "ascending" ? 1 : -1;
		const rank = this.props.sortBy.startsWith("rank")
			? +this.props.sortBy.substr(4)
			: null;
		const total = this.props.sortBy === "total";

		archetypes.sort(
			(a: ArchetypeRankPopularity, b: ArchetypeRankPopularity) => {
				let value = 0;
				if (total) {
					value = a.totalPopularity - b.totalPopularity;
				} else if (rank !== null) {
					value =
						a.rankData[rank].popularityAtRank -
						b.rankData[rank].popularityAtRank;
				} else {
					if (a.playerClass !== b.playerClass) {
						value = a.playerClass > b.playerClass ? 1 : -1;
					}
				}
				return value * direction || (a.name > b.name ? 1 : -1);
			},
		);
	}

	getAllArchetypes(): Archetype[] {
		const popularityData = this.props.popularityData.series.data;
		const archetypeIds = [];
		Object.keys(popularityData).forEach((rank: string) => {
			popularityData[rank].forEach(
				(matchup: ApiArchetypeRankPopularity) => {
					if (archetypeIds.indexOf(matchup.archetype_id) === -1) {
						archetypeIds.push(matchup.archetype_id);
					}
				},
			);
		});
		return archetypeIds
			.map(id => this.getApiArchetype(id))
			.filter(x => x !== undefined);
	}

	getApiArchetype(id: number): Archetype {
		return (
			this.props.archetypeData.find(a => a.id === id) ||
			getOtherArchetype(id)
		);
	}
}

export default withLoading(["archetypeData", "popularityData"])(
	ArchetypePopularity,
);
