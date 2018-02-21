import React from "react";
import { GlobalGamePlayer, ImageProps, CardArtProps } from "../../interfaces";
import ClassIcon from "../ClassIcon";
import GameHistoryPlayer from "./GameHistoryPlayer";
import GameModeIcon from "../GameModeIcon";
import GameModeText from "../GameModeText";
import { PlayState, BnetGameType } from "../../hearthstone";
import { getDuration } from "../../PrettyTime";
import SemanticAge from "../SemanticAge";

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
		let url = "/replay/" + this.props.shortid;
		let result =
			this.props.won !== null
				? this.props.won ? "result-won" : "result-lost"
				: null;
		return (
			<a href={url} className={"match-table-row " + result}>
				<div className="match-table-cell auto-size player-icon">
					<ClassIcon
						heroClassName={
							this.props.friendlyPlayer.hero_class_name
						}
						small={true}
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
						small={true}
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
						? this.props.won ? "Won" : "Lost"
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
							small={true}
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
					{getDuration(this.props.startTime, this.props.endTime)}
				</div>
				<div className="match-table-cell hide-below-768">
					{Math.ceil(this.props.turns / 2)}
				</div>
				<div className="match-table-cell hide-below-500">
					<SemanticAge date={this.props.endTime} />
				</div>
			</a>
		);
	}

	private getModeText(): string {
		switch (this.props.gameType) {
			case BnetGameType.BGT_ARENA:
				return "Arena";
			case BnetGameType.BGT_RANKED_STANDARD:
			case BnetGameType.BGT_CASUAL_STANDARD:
				return "Standard";
			case BnetGameType.BGT_RANKED_WILD:
			case BnetGameType.BGT_CASUAL_WILD:
				return "Wild";
			case BnetGameType.BGT_TAVERNBRAWL_1P_VERSUS_AI:
			case BnetGameType.BGT_TAVERNBRAWL_2P_COOP:
			case BnetGameType.BGT_TAVERNBRAWL_PVP:
				return "Brawl";
			case BnetGameType.BGT_VS_AI:
				return "Adventure";
			case BnetGameType.BGT_FRIENDS:
				return "Friendly";
			default:
				return null;
		}
	}

	private getHeroName(player: GlobalGamePlayer): string {
		if (player.hero_class_name == "NEUTRAL") {
			return player.hero_name;
		}
		return this.toTitleCase(player.hero_class_name);
	}

	private toTitleCase(str: string) {
		return (
			str.substr(0, 1).toUpperCase() +
			str.substr(1, str.length - 1).toLowerCase()
		);
	}
}
