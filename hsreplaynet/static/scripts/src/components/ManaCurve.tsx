import React from "react";
import { CardObj } from "../interfaces";

interface Props {
	cards: CardObj[];
}

export default class ManaCurve extends React.Component<Props> {
	public render(): React.ReactNode {
		const bars = [];
		const costs = [0, 0, 0, 0, 0, 0, 0, 0];

		(this.props.cards || []).forEach(
			cardObj => (costs[Math.min(cardObj.card.cost, 7)] += cardObj.count),
		);

		const maxCost = Math.max.apply(Math, costs) || 1;

		costs.forEach((cost, index) => {
			bars.push(
				<li key={index}>
					<span
						style={{ height: 100 * cost / maxCost + "%" }}
						data-count={cost || ""}
						data-cost={index === 7 ? "7+" : index}
					/>
				</li>,
			);
		});

		return <ul className="mana-curve">{bars}</ul>;
	}
}
