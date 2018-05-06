import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import { getHeroClassName, winrateData } from "../../helpers";
import { TableData } from "../../interfaces";

interface Props extends InjectedTranslateProps {
	opponentWinrateData?: TableData;
	deckListData?: TableData;
	deckId: string;
	playerClass: string;
}

class DeckOverviewTable extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t } = this.props;
		const deck = this.props.deckListData.series.data[
			this.props.playerClass
		].find(x => x.deck_id === this.props.deckId);

		const winrateCell = (
			winrate: number,
			baseWinrate: number,
			tendency: boolean,
		) => {
			const wrData = winrateData(baseWinrate, winrate, 5);
			return (
				<td className="winrate-cell" style={{ color: wrData.color }}>
					{tendency && wrData.tendencyStr}
					{winrate.toFixed(2) + "%"}
				</td>
			);
		};

		const secondsPerTurn =
			deck &&
			Math.round(
				+deck.avg_game_length_seconds /
					(+deck.avg_num_player_turns * 2),
			);

		const opponents = this.props.opponentWinrateData.series.data;
		const rows = [];
		Object.keys(opponents).forEach(opponent => {
			const oppData = opponents[opponent][0];
			if (oppData) {
				rows.push({ opponent, winrate: oppData.winrate });
			}
		});
		rows.sort((a, b) => (a.opponent > b.opponent ? 1 : -1));
		const winrates = rows.map(row => {
			return (
				<tr key={row.opponent}>
					<td>
						vs.&nbsp;
						<span
							className={
								"player-class " + row.opponent.toLowerCase()
							}
						>
							{getHeroClassName(row.opponent)}
						</span>
					</td>
					{winrateCell(row.winrate, deck.win_rate, true)}
				</tr>
			);
		});

		return (
			<table className="table table-striped table-hover half-table">
				<tbody>
					<tr>
						<td>{t("Match duration")}</td>
						<td>
							{deck &&
								t("{{durationInMinutes}} minutes", {
									durationInMinutes: (
										deck.avg_game_length_seconds / 60
									).toFixed(1),
								})}
						</td>
					</tr>
					<tr>
						<td>{t("Turns")}</td>
						<td>{deck && deck.avg_num_player_turns}</td>
					</tr>
					<tr>
						<td>{t("Turn duration")}</td>
						<td>{deck && secondsPerTurn + " seconds"}</td>
					</tr>
					<tr>
						<td>t{"Overall winrate"}</td>
						{deck && winrateCell(deck.win_rate, 50, false)}
					</tr>
					{winrates}
				</tbody>
			</table>
		);
	}
}
export default translate()(DeckOverviewTable);
