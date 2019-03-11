import Tooltip from "./Tooltip";
import React from "react";
import { Archetype } from "../utils/api";
import CardData from "../CardData";
import PrettyCardClass from "./text/PrettyCardClass";
import ArchetypeSignatureTooltip from "./metaoverview/ArchetypeSignatureTooltip";
import { Trans, WithTranslation, withTranslation } from "react-i18next";
import { image } from "../helpers";
import RankIcon from "./RankIcon";
import { BnetGameType } from "../hearthstone";
import { formatNumber } from "../i18n";
import SemanticAge from "./text/SemanticAge";
import i18next from "i18next";

const Opponent: React.FC<{
	playerClass: string;
	archetype: Archetype;
	cardData: CardData;
	gameType: string;
}> = ({ playerClass, archetype, cardData, gameType }) => {
	let result = null;
	if (!archetype || archetype.id < 0) {
		result = <PrettyCardClass cardClass={playerClass} />;
	} else {
		const className =
			"opposing-archetype player-class " + playerClass.toLowerCase();
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
			<span className="opposing-archetype">{result}</span>
		</>
	);
};

const Rank: React.FC<{ rank: number; legendRank?: number }> = ({
	rank,
	legendRank,
}) => (
	<RankIcon
		gameType={BnetGameType.BGT_RANKED_STANDARD}
		rank={rank || 0}
		legendRank={legendRank || 0}
		tooltip
	/>
);

const Outcome: React.FC<{ won: boolean }> = ({ won }) => (
	<strong className="twitch-vod-table-outcome">
		{won ? <Trans>Won</Trans> : <Trans>Lost</Trans>}
	</strong>
);

const Advantage: React.FC<{ first: boolean }> = ({ first }) => (
	<strong>
		<img
			src={image(first ? "first.png" : "coin.png")}
			className="twitch-vod-table-inline-icon"
		/>&nbsp;
		{first ? "first" : "second"}
	</strong>
);

const StreamerName: React.FC<{ channelName: string }> = ({ channelName }) => {
	return (
		<span className="text-twitch twitch-vod-channel-name">
			<img src={image("socialauth/twitch.png")} alt="Twitch" />
			&nbsp;<span>{channelName}</span>
		</span>
	);
};

const GameDuration: React.FC<{ seconds: number; t: i18next.TFunction }> = ({
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

const Age: React.FC<{ date: Date }> = ({ date }) => (
	<SemanticAge date={date} strict={false} />
);

interface Props extends WithTranslation {
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
				<span className="twitch-vod-table-matchup">
					<Rank rank={rank} legendRank={legendRank} />
					<StreamerName channelName={channelName} />
					{opposingPlayerClass ? (
						<>
							<img className="vs-icon" src={image("vs.png")} />
							<Opponent
								playerClass={opposingPlayerClass}
								archetype={opposingArchetype}
								gameType={gameType}
								cardData={cardData}
							/>
						</>
					) : null}
				</span>
				<p>
					<Age date={gameDate} />
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

export default withTranslation()(TwitchVodsTableItem);
