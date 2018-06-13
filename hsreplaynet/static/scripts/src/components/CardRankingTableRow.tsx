import React from "react";
import CardTile from "./CardTile";
import { toDynamicFixed, winrateData } from "../helpers";
import { InjectedTranslateProps, translate } from "react-i18next";
import { formatNumber } from "../i18n";

interface Props extends InjectedTranslateProps {
	card: any;
	customCardText?: string;
	popularity: number;
	rank: number;
	winrate?: number;
	noLink?: boolean;
}

class CardRankingTableRow extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t } = this.props;

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
					{formatNumber(this.props.winrate, 1) + "%"}
				</td>
			);
		}

		return (
			<tr className="card-table-row">
				<td className="rank-cell hidden-xs">
					{t("#{rank}", { rank: this.props.rank })}
				</td>
				<td className="card-cell">{cardTile}</td>
				<td style={{ lineHeight: "19px", fontWeight: "bold" }}>
					{this.getPopularity()}
				</td>
				{winrateCell}
			</tr>
		);
	}

	getPopularity() {
		return toDynamicFixed(this.props.popularity, 1) + "%";
	}
}

export default translate()(CardRankingTableRow);
