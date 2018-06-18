import React from "react";
import { getArchetypeUrl, winrateData } from "../helpers";
import { getCardClass } from "../utils/enums";
import PrettyCardClass from "./text/PrettyCardClass";
import { formatNumber } from "../i18n";

export interface ArchetypeData {
	id: string;
	name: string;
	winrate: number;
}

interface Props {
	playerClass: string;
	totalWinrate?: number;
	archetypes: ArchetypeData[];
}

export default class ClassMatchup extends React.Component<Props> {
	public render(): React.ReactNode {
		const data = this.props.archetypes.sort(
			(a, b) => (a.name > b.name ? 1 : -1),
		);
		const archetypes = data.map(archetype => (
			<a
				className="class-matchup-archetype"
				href={getArchetypeUrl(archetype.id, archetype.name)}
			>
				<span>{archetype.name}</span>
				{this.winrate(archetype.winrate)}
			</a>
		));

		return (
			<div className="class-matchup col-xs-12 col-sm-12 col-md-6 col-lg-4">
				<div className="class-matchup-header">
					<span
						className={
							"player-class " +
							this.props.playerClass.toLowerCase()
						}
					>
						<PrettyCardClass
							cardClass={getCardClass(this.props.playerClass)}
						/>
					</span>
					<span className="pull-right">
						{this.props.totalWinrate &&
							`${formatNumber(this.props.totalWinrate, 2)}%`}
					</span>
				</div>
				{archetypes}
			</div>
		);
	}

	winrate(winrate: number) {
		const wrData = winrateData(this.props.totalWinrate || 50, winrate, 5);
		return (
			<span
				className="winrate-cell pull-right"
				style={{ color: wrData.color }}
			>
				{wrData.tendencyStr}
				{formatNumber(winrate, 2) + "%"}
			</span>
		);
	}
}
