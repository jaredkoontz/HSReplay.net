import React from "react";
import { CardArtProps, GlobalGamePlayer, ImageProps } from "../../interfaces";
import ClassIcon from "../ClassIcon";
import GameModeIcon from "../GameModeIcon";
import GameModeText from "../GameModeText";
import SemanticAge from "../text/SemanticAge";
import SemanticDuration from "../text/SemanticDuration";
import { toTitleCase } from "../../helpers";

interface Props extends ImageProps, CardArtProps {
	shortid: string;
	startTime: Date;
	endTime: Date;
	gameType: number;
	disconnected: boolean;
	scenarioId: number;
	turns: number;
	won: boolean | null;
	friendlyPlayer: GlobalGamePlayer;
	opposingPlayer: GlobalGamePlayer;
}

export default class GameHistoryTableRow extends React.Component<Props> {
	public render(): React.ReactNode {
		const url = "/replay/" + this.props.shortid;
		const result =
			this.props.won !== null
				? this.props.won
					? "result-won"
					: "result-lost"
				: null;
		return (
			<a href={url} className={"match-table-row " + result}>
				<div className="match-table-cell auto-size player-icon">
					<ClassIcon
						heroClassName={
							this.props.friendlyPlayer.hero_class_name
						}
						small
					/>
				</div>
				<div className="match-table-cell auto-size hide-below-768 player-name">
					{this.getHeroName(this.props.friendlyPlayer)}
				</div>
				<div className="match-table-cell auto-size">vs.</div>
				<div className="match-table-cell auto-size opponent-icon">
					<ClassIcon
						heroClassName={
							this.props.opposingPlayer.hero_class_name
						}
						small
					/>
				</div>
				<div className="match-table-cell auto-size hide-below-768 opponent-name">
					{this.getHeroName(this.props.opposingPlayer)}
				</div>
				<div className="match-table-cell" />
				<div className="match-table-cell hide-below-1100">
					{this.props.opposingPlayer.name}
				</div>
				<div className={"match-table-cell " + result}>
					{this.props.won !== null
						? this.props.won
							? "Won"
							: "Lost"
						: "Unknown"}
				</div>
				<div className="match-table-cell">
					<div className="match-table-game-type">
						<GameModeIcon
							className="hsreplay-type-sm"
							player={this.props.friendlyPlayer}
							gameType={this.props.gameType}
							disconnected={this.props.disconnected}
							scenarioId={this.props.scenarioId}
							small
						/>
						<GameModeText
							className="hsreplay-type-sm"
							player={this.props.friendlyPlayer}
							gameType={this.props.gameType}
							scenarioId={this.props.scenarioId}
						/>
					</div>
				</div>
				<div className="match-table-cell hide-below-1600">
					<SemanticDuration
						from={this.props.startTime}
						to={this.props.endTime}
						strict
					/>
				</div>
				<div className="match-table-cell hide-below-768">
					{Math.ceil(this.props.turns / 2)}
				</div>
				<div className="match-table-cell hide-below-500">
					<SemanticAge date={this.props.endTime} strict />
				</div>
			</a>
		);
	}

	private getHeroName(player: GlobalGamePlayer): string {
		if (player.hero_class_name === "NEUTRAL") {
			return player.hero_name;
		}
		return toTitleCase(player.hero_class_name);
	}
}
