import React from "react";
import { PlayState } from "../../hearthstone";
import {
	CardArtProps,
	GameReplay,
	GlobalGamePlayer,
	ImageProps,
} from "../../interfaces";
import GameHistoryItem from "./GameHistoryItem";
import AdContainer from "../ads/AdContainer";
import AdUnit from "../ads/AdUnit";
import * as _ from "lodash";

interface Props extends ImageProps, CardArtProps {
	games: GameReplay[];
}

export default class GameHistoryList extends React.Component<Props> {
	public render(): React.ReactNode {
		const columns = [];
		const ads = _.range(4, 100, 2).map(x => (
			<AdContainer>
				<AdUnit id={`mr-d-${x}`} size="728x90" />
				<AdUnit id={`mr-d-${x + 1}`} size="728x90" />
			</AdContainer>
		));
		const getAd = id => {
			return id < ads.length && id >= 0 ? ads[id] : null;
		};
		this.props.games.forEach((game: GameReplay, i: number) => {
			const startTime: Date = new Date(game.global_game.match_start);
			const endTime: Date = new Date(game.global_game.match_end);
			if (i > 0) {
				if (!(i % 2)) {
					columns.push(<div className="clearfix visible-sm-block" />);
					if (!(i % 4)) {
						columns.push(
							<div className="visible-sm">
								{getAd(i / 4 - 1)}
							</div>,
						);
					}
				}
				if (!(i % 3)) {
					columns.push(<div className="clearfix visible-md-block" />);
					if (!(i % 6)) {
						columns.push(
							<div className="visible-md">
								{getAd(i / 6 - 1)}
							</div>,
						);
					}
				}
				if (!(i % 4)) {
					columns.push(<div className="clearfix visible-lg-block" />);
					if (!(i % 8)) {
						columns.push(
							<div className="visible-lg">
								{getAd(i / 8 - 1)}
							</div>,
						);
					}
				}
			}

			const players = [];
			if (game.friendly_player) {
				players.push(game.friendly_player);
			}
			if (game.opposing_player) {
				players.push(game.opposing_player);
			}

			columns.push(
				<GameHistoryItem
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
		});
		return <div className="row">{columns}</div>;
	}

	public static hasWon(
		friendlyPlayer: GlobalGamePlayer,
		opposingPlayer: GlobalGamePlayer,
	): boolean | null {
		if (!friendlyPlayer) {
			return null;
		}
		if (
			[PlayState.WINNING, PlayState.WON].indexOf(
				friendlyPlayer.final_state,
			) !== -1
		) {
			return true;
		}
		if (
			[PlayState.LOSING, PlayState.LOST].indexOf(
				friendlyPlayer.final_state,
			) !== -1
		) {
			return false;
		}
		return null;
	}
}
