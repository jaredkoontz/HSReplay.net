import React from "react";
import { CardObj } from "../interfaces";

interface Props {
	cards: CardObj[];
}

export default class ManaCurve extends React.Component<Props> {
	public render(): React.ReactNode {
		const counts = [0, 0, 0, 0, 0, 0, 0, 0];
		(this.props.cards || []).forEach(
			cardObj =>
				(counts[Math.min(cardObj.card.cost, 7)] += cardObj.count),
		);

		const highestCount = Math.max.apply(Math, counts) || 1;

		const bars = counts.map((count, cost) => (
			<li key={cost}>
				<span
					style={{ height: 100 * count / highestCount + "%" }}
					data-count={count || ""}
					data-cost={cost === 7 ? "7+" : cost}
				/>
			</li>
		));

		return <ul className="mana-curve">{bars}</ul>;
	}
}
