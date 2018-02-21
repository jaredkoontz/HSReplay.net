import React from "react";
import CardTile from "./CardTile";
import { winrateData } from "../helpers";

interface Props {
	card: any;
	customCardText?: string;
	popularity: number;
	rank: number;
	winrate?: number;
	noLink?: boolean;
}

export default class CardRankingTableRow extends React.Component<Props> {
	public render(): React.ReactNode {
		if (!this.props.card) {
			return null;
		}
		const cardTile = (
			<CardTile
				height={34}
				card={this.props.card}
				count={1}
				customText={this.props.customCardText}
				disableTooltip={this.props.noLink}
				noLink={this.props.noLink}
			/>
		);

		let winrateCell = null;
		if (this.props.winrate !== undefined) {
			const wrData = winrateData(50, this.props.winrate, 2);
			winrateCell = (
				<td style={{ color: wrData.color }}>
					{this.props.winrate + "%"}
				</td>
			);
		}

		return (
			<tr className="card-table-row">
				<td className="rank-cell hidden-xs">{"#" + this.props.rank}</td>
				<td className="card-cell">{cardTile}</td>
				<td style={{ lineHeight: "19px", fontWeight: "bold" }}>
					{this.getPopularity()}
				</td>
				{winrateCell}
			</tr>
		);
	}

	getPopularity() {
		const digits =
			Math.min(
				Math.max(0, Math.floor(Math.log10(1 / this.props.popularity))),
				2
			) + 2;
		return this.props.popularity.toFixed(digits) + "%";
	}
}
