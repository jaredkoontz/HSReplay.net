import React from "react";
import { CardArtProps, GlobalGamePlayer, ImageProps } from "../../interfaces";
import GameHistoryPlayer from "./GameHistoryPlayer";
import GameModeIcon from "../GameModeIcon";
import GameModeText from "../GameModeText";
import { PlayState } from "../../hearthstone";
import SemanticAge from "../text/SemanticAge";
import SemanticDuration from "../text/SemanticDuration";

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

export default class GameHistoryItem extends React.Component<Props> {
	public render(): React.ReactNode {
		return (
			<div className="col-xs-12 col-sm-6 col-md-4 col-lg-3 game-history-item">
				<a
					href={"/replay/" + this.props.shortid}
					className={
						this.props.won !== null
							? this.props.won
								? "won"
								: "lost"
							: null
					}
				>
					<div className="hsreplay-involved">
						<img
							src={this.props.image("vs.png")}
							className="hsreplay-versus"
						/>
						{[
							this.props.friendlyPlayer,
							this.props.opposingPlayer,
						].map((player: GlobalGamePlayer, i: number) => {
							if (!player) {
								return null;
							}
							return (
								<GameHistoryPlayer
									key={i}
									cardArt={this.props.cardArt}
									name={player.name}
									heroId={player.hero_id}
									won={player.final_state == PlayState.WON}
								/>
							);
						})}
					</div>
					<div className="hsreplay-details">
						<dl>
							<dt>Played</dt>
							<dd>
								<SemanticAge date={this.props.endTime} strict />
							</dd>
							<dt>Duration</dt>
							<dd>
								<SemanticDuration
									from={this.props.startTime}
									to={this.props.endTime}
									strict
								/>
							</dd>
							<dt>Turns</dt>
							<dd>{Math.ceil(this.props.turns / 2)} turns</dd>
						</dl>
						<div>
							<GameModeIcon
								className="hsreplay-type"
								player={this.props.friendlyPlayer}
								gameType={this.props.gameType}
								disconnected={this.props.disconnected}
								scenarioId={this.props.scenarioId}
							/>
							<GameModeText
								player={this.props.friendlyPlayer}
								gameType={this.props.gameType}
								scenarioId={this.props.scenarioId}
							/>
						</div>
					</div>
				</a>
			</div>
		);
	}
}
