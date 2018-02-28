import React from "react";
import { ApiArchetype, ApiArchetypePopularity } from "../../interfaces";
import { withLoading } from "../loading/Loading";
import CardData from "../../CardData";
import ArchetypeListItem from "./ArchetypeListItem";
import InfoIcon from "../InfoIcon";

interface ClassArchetypeData {
	[playerClass: string]: ApiArchetypePopularity[];
}

interface Props {
	archetypeData?: ApiArchetype[];
	cardData: CardData;
	data?: ClassArchetypeData;
	deckData?: any;
	gameType: string;
	timestamp?: string;
}

class ArchetypeTierList extends React.Component<Props> {
	public render(): React.ReactNode {
		const archetypes = Object.keys(this.props.data)
			.map(key => this.props.data[key])
			.reduce((a, b) => a.concat(b))
			.filter(d => d.archetype_id > 0 && d.pct_of_total > 0.5)
			.sort((a, b) => b.win_rate - a.win_rate);
		const values = archetypes.map(d => d.win_rate);
		const avg = this.average(values);
		const stdDevWinning = this.standardDeviation(
			values.filter(x => x >= 50),
		);
		const stdDevLosing = this.standardDeviation(values.filter(x => x < 50));
		const max = Math.max(...values);
		const buckets = [
			wr => wr > max - stdDevWinning,
			wr => wr >= 50,
			wr => wr > 50 - stdDevLosing,
			() => true,
		];

		const tiers = [[], [], [], []];

		archetypes.forEach(archetype => {
			const index = buckets.findIndex(bucket =>
				bucket(archetype.win_rate),
			);
			tiers[index].push(
				<ArchetypeListItem
					archetype={archetype}
					archetypeData={this.props.archetypeData}
					cardData={this.props.cardData}
					deckData={this.props.deckData.series.data}
				/>,
			);
		});

		return (
			<div className="archetype-tier-list">
				{tiers.map((tier, index) => {
					if (!tier.length) {
						return;
					}
					return (
						<div className="tier" key={"tier" + index}>
							<div className="tier-header">
								Tier {index + 1}
								<InfoIcon
									header={`Tier ${index + 1}: ${
										this.tierInfoHeader[index]
									}`}
									content={this.tierInfo[index]}
								/>
							</div>
							{tier}
						</div>
					);
				})}
			</div>
		);
	}

	standardDeviation(values: number[]) {
		const avg = this.average(values);
		const squareDiffs = values.map(value => {
			const diff = value - avg;
			return diff * diff;
		});
		return Math.sqrt(this.average(squareDiffs)) || 0.5;
	}

	average(data: number[]) {
		return data.reduce((a, b) => a + b, 0) / data.length;
	}

	tierInfo = [
		"Winrate within one standard deviation of the strongest archetype.",
		"Winrate above 50%.",
		"Winrate within one standard deviation below 50%.",
		"Winrate more than one standard deviation below 50%.",
	];

	tierInfoHeader = [
		"Overperforming Archetypes",
		"Winning Archetypes",
		"Underperforming Archetypes",
		"Losing Archetypes",
	];
}

export default withLoading(["data", "deckData", "archetypeData", "cardData"])(
	ArchetypeTierList,
);
