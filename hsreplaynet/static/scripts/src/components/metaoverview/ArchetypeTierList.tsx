import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import CardData from "../../CardData";
import { ApiArchetypePopularity } from "../../interfaces";
import { Archetype } from "../../utils/api";
import InfoIcon from "../InfoIcon";
import { withLoading } from "../loading/Loading";
import ArchetypeListItem from "./ArchetypeListItem";
import AdContainer from "../ads/AdContainer";
import NitropayAdUnit from "../ads/NitropayAdUnit";

interface ClassArchetypeData {
	[playerClass: string]: ApiArchetypePopularity[];
}

interface Props extends WithTranslation {
	archetypeData?: Archetype[];
	cardData: CardData;
	data?: ClassArchetypeData;
	deckData?: any;
	gameType: string;
	timestamp?: string;
}

class ArchetypeTierList extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t } = this.props;
		const archetypes = Object.keys(this.props.data)
			.map(key => this.props.data[key])
			.reduce((a, b) => a.concat(b))
			.filter(d => d.archetype_id > 0 && d.pct_of_total > 0.5)
			.sort((a, b) => b.win_rate - a.win_rate);
		const values = archetypes.map(d => d.win_rate);
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
					key={archetype.archetype_id}
					archetype={archetype}
					archetypeData={this.props.archetypeData}
					cardData={this.props.cardData}
					deckData={this.props.deckData.series.data}
				/>,
			);
		});

		const tierInfo = [
			t(
				"Winrate within one standard deviation of the strongest archetype.",
			),
			t("Winrate above 50%."),
			t("Winrate within one standard deviation below 50%."),
			t("Winrate more than one standard deviation below 50%."),
		];

		const tierInfoHeader = [
			t("Overperforming Archetypes"),
			t("Winning Archetypes"),
			t("Underperforming Archetypes"),
			t("Losing Archetypes"),
		];

		const adUnitIds = [
			["mp-d-3", "mp-d-4"],
			["mp-d-5", "mp-d-6"],
			["mp-d-7", "mp-d-8"],
		];

		return (
			<div className="archetype-tier-list">
				{tiers.map((tier, index) => {
					if (!tier.length) {
						return;
					}
					return (
						<>
							<div className="tier" key={"tier" + index}>
								<div className="tier-header">
									{t("Tier {n}", { n: index + 1 })}
									<InfoIcon
										header={t("Tier {n}: {description}", {
											n: index + 1,
											description: tierInfoHeader[index],
										})}
										content={tierInfo[index]}
									/>
								</div>
								{tier}
							</div>
							{adUnitIds.length > index ? (
								<>
									<AdContainer key={`ad-container-${index}`}>
										<NitropayAdUnit
											id={adUnitIds[index][0]}
											size="728x90"
										/>
										<NitropayAdUnit
											id={adUnitIds[index][1]}
											size="728x90"
										/>
									</AdContainer>
									<NitropayAdUnit
										id={`mp-m-${index + 2}`}
										size="300x250"
										mobile
									/>
								</>
							) : null}
						</>
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
}

export default withLoading(["data", "deckData", "archetypeData", "cardData"])(
	withTranslation()(ArchetypeTierList),
);
