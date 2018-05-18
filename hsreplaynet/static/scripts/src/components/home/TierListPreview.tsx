import React from "react";
import { ApiArchetypePopularity } from "../../interfaces";
import { withLoading } from "../loading/Loading";
import CardData from "../../CardData";
import { Archetype } from "../../utils/api";
import ClassList, { ClassListData } from "./ClassList";
import Panel from "../Panel";
import { InjectedTranslateProps, translate } from "react-i18next";

interface ClassArchetypeData {
	[playerClass: string]: ApiArchetypePopularity[];
}

interface Props extends InjectedTranslateProps {
	archetypeData?: Archetype[];
	cardData: CardData;
	data?: ClassArchetypeData;
	deckData?: any;
}

class TierListPreview extends React.Component<Props> {
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

		const tiers: ClassListData[][] = [[], [], [], []];

		archetypes.forEach(archetype => {
			const index = buckets.findIndex(bucket =>
				bucket(archetype.win_rate),
			);
			const archetypeData = this.props.archetypeData.find(
				x => x.id === archetype.archetype_id,
			);
			if (!archetypeData) {
				return;
			}
			tiers[index].push({
				playerClass: archetypeData.player_class_name,
				title: [
					<span
						key="name"
						className={
							"class-name player-class " +
							archetypeData.player_class_name.toLowerCase()
						}
					>
						{archetypeData.name}
					</span>,
				],
				winRate: archetype.win_rate,
				buttonText: t("View archetype"),
				href: archetypeData.url,
			});
		});

		let count = 0;
		const classLists = [];
		tiers.forEach((x, i) => {
			const items = x.slice(0, Math.min(8 - count, x.length));
			if (items.length === 0) {
				return;
			}
			count += items.length;
			classLists.push(
				<Panel
					header={t("Tier {n}", { n: i + 1 })}
					theme="dark"
					accent="blue"
					key={i}
				>
					<ClassList
						data={items}
						style={{ height: items.length * 50 + "px" }}
					/>
				</Panel>,
			);
		});

		return <div className="tier-list-preview">{classLists}</div>;
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
	translate()(TierListPreview),
);
