import React from "react";
import { TableData } from "../../interfaces";
import PrettyCardClass from "../text/PrettyCardClass";
import { Trans, WithTranslation, withTranslation } from "react-i18next";
import { formatNumber } from "../../i18n";

interface Props extends WithTranslation {
	data?: TableData;
}

class DeckStatsWinrates extends React.Component<Props> {
	public render(): React.ReactNode {
		const data = Object.assign({}, this.props.data.series.data);
		const keys = Object.keys(this.props.data.series.data);
		keys.sort(
			(a, b) =>
				data[a][0]["player_class"] > data[b][0]["player_class"]
					? 1
					: -1,
		);
		const winrates = [];
		keys.forEach(key => {
			const winrate = +data[key][0]["win_rate"];
			const playerClass = (
				<PrettyCardClass cardClass={data[key][0]["player_class"]} />
			);
			winrates.push(
				<li>
					<Trans defaults="vs. <0></0>" components={[playerClass]} />
					<span className="infobox-value">
						{formatNumber(+winrate, 1) + "%"}
					</span>
				</li>,
			);
		});
		return <ul>{winrates}</ul>;
	}
}

export default withTranslation()(DeckStatsWinrates);
