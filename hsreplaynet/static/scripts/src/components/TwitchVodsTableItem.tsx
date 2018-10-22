import React from "react";
import { InjectedTranslateProps, Trans, translate } from "react-i18next";
import { Archetype } from "../utils/api";
import CardData from "../CardData";
import PrettyCardClass from "./text/PrettyCardClass";
import ArchetypeSignatureTooltip from "./metaoverview/ArchetypeSignatureTooltip";
import Tooltip from "./Tooltip";
import { image } from "../helpers";
import RankIcon from "./RankIcon";
import { BnetGameType } from "../hearthstone";
import { formatNumber } from "../i18n";
import SemanticAge from "./text/SemanticAge";
import { TranslationFunction } from "i18next";

const Opponent: React.SFC<{
	playerClass: string;
	archetype: Archetype;
	cardData: CardData;
	gameType: string;
}> = ({ playerClass, archetype, cardData, gameType }) => {
	let result = null;
	const className = "player-class " + playerClass.toLowerCase();
	if (!archetype || archetype.id < 0 || 1 === 1) {
		result = <PrettyCardClass cardClass={playerClass} />;
	} else {
		return (
			<ArchetypeSignatureTooltip
				key={archetype.id}
				cardData={cardData}
				archetypeId={archetype.id}
				archetypeName={archetype.name}
				gameType={gameType}
			>
				<a className={className} href={archetype.url}>
					{archetype.name}
				</a>
			</ArchetypeSignatureTooltip>
		);
	}
	return (
		<>
			<span className="twitch-vod-table-icon">
				<Tooltip
					content={<PrettyCardClass cardClass={playerClass} />}
					simple
				>
					<img
						src={image(
							`64x/class-icons/${playerClass.toLowerCase()}.png`,
						)}
						className="class-icon"
					/>
				</Tooltip>
			</span>
			<span className="opposing-archetype">{result}</span>
		</>
	);
};

const Rank: React.SFC<{ rank: number; legendRank?: number }> = ({
	rank,
	legendRank,
}) => (
	<span className="twitch-vod-table-icon">
		<RankIcon
			gameType={BnetGameType.BGT_RANKED_STANDARD}
			rank={rank || 0}
			legendRank={legendRank || 0}
			tooltip
		/>
	</span>
);

const Outcome: React.SFC<{ won: boolean }> = ({ won }) => (
	<strong className="twitch-vod-table-outcome">
		<span
			className={
				"glyphicon " + (won ? " glyphicon-ok" : "glyphicon-remove")
			}
		/>&nbsp;
		{won ? <Trans>Won</Trans> : <Trans>Lost</Trans>}
	</strong>
);

const Advantage: React.SFC<{ first: boolean }> = ({ first }) => (
	<strong>
		<img
			src={image(first ? "first.png" : "coin.png")}
			className="twitch-vod-table-inline-icon"
		/>&nbsp;
		{first ? "first" : "second"}
	</strong>
);

const StreamerName: React.SFC<{ channelName: string }> = ({ channelName }) => {
	return (
		<span className="text-twitch twitch-vod-channel-name">
			<img src={image("socialauth/twitch.png")} alt="Twitch" />
			&nbsp;<span>{channelName}</span>
		</span>
	);
};

const GameDuration: React.SFC<{ seconds: number; t: TranslationFunction }> = ({
	seconds,
	t,
}) => {
	return (
		<span className="game-duration">
			<span className="glyphicon glyphicon-time" />&nbsp;
			{t("{minutes} min", {
				minutes: formatNumber(seconds / 60, 1),
			} as any)}
		</span>
	);
};

const Age: React.SFC<{ date: Date }> = ({ date }) => (
	<SemanticAge date={date} strict={false} />
);

interface Props extends InjectedTranslateProps {
	rank: number;
	legendRank: number | null;
	channelName: string;
	won: boolean | null;
	wentFirst: boolean | null;
	gameDate: Date;
	gameLengthSeconds: number;
	opposingPlayerClass: string | null;
	opposingArchetype: Archetype | null;
	gameType: string;
	cardData: CardData;
}

class TwitchVodsTableItem extends React.Component<Props> {
	public render(): React.ReactNode {
		const {
			rank,
			legendRank,
			channelName,
			won,
			wentFirst,
			gameLengthSeconds,
			opposingPlayerClass,
			opposingArchetype,
			gameDate,
			gameType,
			cardData,
		} = this.props;
		return (
			<>
				<p>
					<span className="twitch-vod-table-icons">
						<Rank rank={rank} legendRank={legendRank} />
						{opposingPlayerClass ? (
							<Opponent
								playerClass={opposingPlayerClass}
								archetype={opposingArchetype}
								gameType={gameType}
								cardData={cardData}
							/>
						) : null}
					</span>
				</p>
				<p>
					Played by <StreamerName channelName={channelName} />{" "}
					<Age date={new Date(gameDate)} />
				</p>
				<p>
					<Outcome won={won} />{" "}
					{wentFirst !== null ? (
						<>
							going <Advantage first={wentFirst} />{" "}
						</>
					) : null}
					after{" "}
					<GameDuration
						seconds={gameLengthSeconds}
						t={this.props.t}
					/>
				</p>
			</>
		);
	}
}

export default translate()(TwitchVodsTableItem);
