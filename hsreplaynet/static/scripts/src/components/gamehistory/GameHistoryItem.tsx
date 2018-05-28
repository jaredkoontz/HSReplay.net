import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import { PlayState } from "../../hearthstone";
import { CardArtProps, GlobalGamePlayer, ImageProps } from "../../interfaces";
import GameModeIcon from "../GameModeIcon";
import GameModeText from "../GameModeText";
import SemanticAge from "../text/SemanticAge";
import SemanticDuration from "../text/SemanticDuration";
import GameHistoryPlayer from "./GameHistoryPlayer";

interface Props extends ImageProps, CardArtProps, InjectedTranslateProps {
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

class GameHistoryItem extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t } = this.props;
		return (
			<div className="col-xs-12 col-sm-6 col-md-4 col-lg-3 game-history-item">
				<a
					href={`/replay/${this.props.shortid}`}
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
						].map(player => {
							if (!player) {
								return null;
							}
							return (
								<GameHistoryPlayer
									key={player.player_id}
									cardArt={this.props.cardArt}
									name={player.name}
									heroId={player.hero_id}
									won={player.final_state === PlayState.WON}
								/>
							);
						})}
					</div>
					<div className="hsreplay-details">
						<dl>
							<dt>{t("Played")}</dt>
							<dd>
								<SemanticAge date={this.props.endTime} strict />
							</dd>
							<dt>{t("Duration")}</dt>
							<dd>
								<SemanticDuration
									from={this.props.startTime}
									to={this.props.endTime}
									strict
								/>
							</dd>
							<dt>{t("Turns")}</dt>
							<dd>
								{t("{turns} turns", {
									turns: Math.ceil(this.props.turns / 2),
								})}
							</dd>
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
export default translate()(GameHistoryItem);
