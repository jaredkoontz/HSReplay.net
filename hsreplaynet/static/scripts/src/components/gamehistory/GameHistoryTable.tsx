import React from "react";
import GameHistoryTableRow from "./GameHistoryTableRow";
import {
	GameReplay,
	CardArtProps,
	ImageProps,
	GlobalGamePlayer
} from "../../interfaces";
import GameHistoryList from "./GameHistoryList";

interface Props extends ImageProps, CardArtProps {
	games: GameReplay[];
}

export default class GameHistoryTable extends React.Component<Props> {
	public render(): React.ReactNode {
		let columns = [];
		this.props.games.forEach((game: GameReplay, i: number) => {
			var startTime: Date = new Date(game.global_game.match_start);
			var endTime: Date = new Date(game.global_game.match_end);

			let players = [];
			if (game.friendly_player) {
				players.push(game.friendly_player);
			}
			if (game.opposing_player) {
				players.push(game.opposing_player);
			}

			columns.push(
				<GameHistoryTableRow
					key={i}
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
						game.opposing_player
					)}
					friendlyPlayer={game.friendly_player}
					opposingPlayer={game.opposing_player}
				/>
			);
		});
		return (
			<div className="match-table">
				<div className="match-table-header">
					<div className="match-table-row">
						<div className="match-table-cell auto-size match-header">
							<span>Match</span>
						</div>
						<div className="match-table-cell auto-size hide-below-768" />
						<div className="match-table-cell auto-size" />
						<div className="match-table-cell auto-size hide-below-768" />
						<div className="match-table-cell auto-size" />
						<div className="match-table-cell" />
						<div className="match-table-cell hide-below-1100">
							Opponent
						</div>
						<div className="match-table-cell">Result</div>
						<div className="match-table-cell">Mode</div>
						<div className="match-table-cell hide-below-1600">
							Duration
						</div>
						<div className="match-table-cell hide-below-768">
							Turns
						</div>
						<div className="match-table-cell hide-below-500">
							Played
						</div>
					</div>
				</div>
				<div className="match-table-body">{columns}</div>
			</div>
		);
	}
}
