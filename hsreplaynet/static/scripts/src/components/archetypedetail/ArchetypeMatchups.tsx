import React from "react";
import {
	ApiArchetype,
	ApiArchetypePopularity,
	SortDirection
} from "../../interfaces";
import { withLoading } from "../loading/Loading";
import ClassArchetypesBox from "../metaoverview/ClassArchetypesBox";
import CardData from "../../CardData";

interface Props {
	archetypeId: number;
	archetypeMatchupData?: any;
	archetypeData?: any;
	cardData?: CardData;
	gameType?: string;
	minGames?: number;
}

interface State {
	sortBy: string;
	sortDirection: SortDirection;
}

class ArchetypeMatchups extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			sortBy: "archetype",
			sortDirection: "ascending"
		};
	}

	public render(): React.ReactNode {
		const { archetypeMatchupData, archetypeId, minGames } = this.props;

		const opponentClasses: { [key: string]: ApiArchetypePopularity[] } = {};
		const games: { [key: string]: number } = {};
		Object.keys(archetypeMatchupData).forEach(opponentId => {
			const opponentArchetype = this.getArchetype(+opponentId);
			if (opponentArchetype) {
				const opponentClass = opponentArchetype.player_class_name;
				const matchup = archetypeMatchupData[opponentId];
				if (matchup.total_games < (minGames || 0)) {
					return;
				}
				if (!opponentClasses[opponentClass]) {
					opponentClasses[opponentClass] = [];
				}
				games[opponentClass] =
					(games[opponentClass] || 0) + matchup.total_games;
				opponentClasses[opponentClass].push({
					archetype_id: +opponentArchetype.id,
					pct_of_class: matchup.total_games,
					pct_of_total: 0,
					total_games: matchup.total_games,
					win_rate: matchup.win_rate
				});
			}
		});

		if (Object.keys(opponentClasses).length === 0) {
			return (
				<h3 className="message-wrapper">
					Not enough games for meaningful matchup data available.
				</h3>
			);
		}

		Object.keys(opponentClasses).forEach(key => {
			opponentClasses[key].forEach(data => {
				data.pct_of_class *= 100.0 / games[key];
			});
		});

		const tiles = Object.keys(opponentClasses)
			.sort()
			.map(key => (
				<ClassArchetypesBox
					archetypeData={this.props.archetypeData}
					cardData={this.props.cardData}
					data={opponentClasses[key]}
					gameType={this.props.gameType}
					onSortChanged={(
						sortBy: string,
						sortDirection: SortDirection
					) => {
						this.setState({ sortBy, sortDirection });
					}}
					playerClass={key}
					sortBy={this.state.sortBy}
					sortDirection={this.state.sortDirection}
				/>
			));

		return <div className="class-box-container">{tiles}</div>;
	}

	getArchetype(archetypeId: number): ApiArchetype {
		return this.props.archetypeData.find(x => x.id === archetypeId);
	}
}

export default withLoading(["archetypeMatchupData", "archetypeData"])(
	ArchetypeMatchups
);
