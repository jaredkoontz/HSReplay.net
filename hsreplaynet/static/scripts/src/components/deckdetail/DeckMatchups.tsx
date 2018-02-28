import React from "react";
import ClassMatchup, { ArchetypeData } from "../ClassMatchup";

interface Props {
	archetypeMatchupData?: any;
	classMatchupData?: any;
	archetypeData?: any;
}

export default class DeckMatchups extends React.Component<Props> {
	public render(): React.ReactNode {
		const matchupsTiles = [];
		const matchupData = this.props.classMatchupData.series.data;
		const playerClasses = Object.keys(matchupData).filter(
			playerClass => matchupData[playerClass].length,
		);
		playerClasses.sort();
		playerClasses.forEach((playerClass: string, i: number) => {
			if (matchupData[playerClass].length) {
				matchupsTiles.push(
					<ClassMatchup
						archetypes={this.getArchetypes(playerClass)}
						playerClass={playerClass}
						totalWinrate={matchupData[playerClass][0].winrate}
					/>,
				);
				if ((i + 1) % 2 === 0) {
					matchupsTiles.push(
						<div className="clearfix visible-md-block" />,
					);
				}
				if ((i + 1) % 3 === 0) {
					matchupsTiles.push(
						<div className="clearfix visible-lg-block" />,
					);
				}
			}
		});
		return <div className="deck-matchups">{matchupsTiles}</div>;
	}

	getArchetypes(playerClass: string): ArchetypeData[] {
		const archetypes = [];
		this.props.archetypeMatchupData.series.data[playerClass].forEach(
			archetype => {
				const data = this.props.archetypeData.find(
					a => a.id === archetype.archetype_id,
				);
				if (data) {
					archetypes.push({
						id: archetype.archetype_id,
						name: data.name,
						winrate: archetype.win_rate,
					});
				}
			},
		);
		return archetypes;
	}
}
