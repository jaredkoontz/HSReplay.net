import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import { CardArtProps, GameReplay, ImageProps } from "../../interfaces";
import GameHistoryList from "./GameHistoryList";
import GameHistoryTableRow from "./GameHistoryTableRow";
import AdContainer from "../ads/AdContainer";
import AdUnit from "../ads/AdUnit";
import * as _ from "lodash";

interface Props extends ImageProps, CardArtProps, InjectedTranslateProps {
	games: GameReplay[];
}

class GameHistoryTable extends React.Component<Props> {
	public render(): React.ReactNode {
		const columns = [];
		const { t } = this.props;
		const ads = _.range(4, 20, 2).map(x => (
			<tr className="ad-row">
				<td colSpan={20}>
					<AdContainer>
						<AdUnit id={`mr-d-${x}`} size="728x90" />
						<AdUnit id={`mr-d-${x + 1}`} size="728x90" />
					</AdContainer>
				</td>
			</tr>
		));
		const getAd = id => {
			return id < ads.length && id >= 0 ? ads[id] : null;
		};
		this.props.games.forEach((game, index) => {
			const startTime: Date = new Date(game.global_game.match_start);
			const endTime: Date = new Date(game.global_game.match_end);

			const players = [];
			if (game.friendly_player) {
				players.push(game.friendly_player);
			}
			if (game.opposing_player) {
				players.push(game.opposing_player);
			}

			columns.push(
				<GameHistoryTableRow
					key={game.shortid}
					cardArt={this.props.cardArt}
					image={this.props.image}
					shortid={game.shortid}
					startTime={startTime}
					endTime={endTime}
					gameType={game.global_game.game_type}
					disconnected={game.disconnected}
					scenarioId={game.global_game.scenario_id}
					turns={game.global_game.num_turns}
					won={GameHistoryList.hasWon(
						game.friendly_player,
						game.opposing_player,
					)}
					friendlyPlayer={game.friendly_player}
					opposingPlayer={game.opposing_player}
				/>,
			);

			if ((index + 1) % 15 === 0 && index > 0) {
				columns.push(getAd((index + 1) / 15 - 1));
			}
		});
		return (
			<div className="match-table">
				<div className="match-table-header">
					<div className="match-table-row">
						<div className="match-table-cell auto-size match-header">
							<span>{t("Match")}</span>
						</div>
						<div className="match-table-cell auto-size hide-below-768" />
						<div className="match-table-cell auto-size" />
						<div className="match-table-cell auto-size hide-below-768" />
						<div className="match-table-cell auto-size" />
						<div className="match-table-cell" />
						<div className="match-table-cell hide-below-1100">
							{t("Opponent")}
						</div>
						<div className="match-table-cell">{t("Result")}</div>
						<div className="match-table-cell">{t("Mode")}</div>
						<div className="match-table-cell hide-below-1600">
							{t("Duration")}
						</div>
						<div className="match-table-cell hide-below-768">
							{t("Turns")}
						</div>
						<div className="match-table-cell hide-below-500">
							{t("Played")}
						</div>
					</div>
				</div>
				<div className="match-table-body">{columns}</div>
			</div>
		);
	}
}

export default translate()(GameHistoryTable);
