import React from "react";
import { ProfileGameData } from "./ProfileArchetypeList";
import { InjectedTranslateProps } from "react-i18next";
import { translate } from "../../__mocks__/react-i18next";
import { getCardClassName, getHeroClassName, image } from "../../helpers";
import SemanticAge from "../text/SemanticAge";
import { formatNumber } from "../../i18n";
import RankIcon from "../RankIcon";
import { BnetGameType } from "../../hearthstone";
import ArchetypeSignatureTooltip from "../metaoverview/ArchetypeSignatureTooltip";
import CardData from "../../CardData";

interface Props extends InjectedTranslateProps {
	data: ProfileGameData;
	cardData: CardData;
	gameType: string;
}

class ProfileReplayPanel extends React.Component<Props> {
	public render(): React.ReactNode {
		const { data, t } = this.props;
		const opponentClass = getCardClassName(data.opponentPlayerClass);
		return (
			<li className="profile-replay-panel">
				<div className="data-container">
					<div
						className="col-lg-1 col-lg-offset-1"
						style={{
							color: data.won ? "green" : "red",
							textTransform: "uppercase",
						}}
					>
						{data.won ? t("Win") : t("Loss")}
					</div>
					<div className="col-lg-2 align-left">
						<p
							className={`player-class ${opponentClass.toLowerCase()}`}
						>
							{data.opponentArchetype ? (
								<ArchetypeSignatureTooltip
									key={data.opponentArchetype.id}
									cardData={this.props.cardData}
									archetypeId={data.opponentArchetype.id}
									archetypeName={data.opponentArchetype.name}
									gameType={this.props.gameType}
								>
									<a
										href={`/archetypes/${
											data.opponentArchetype.id
										}`}
									>
										{data.opponentArchetype.name}
									</a>
								</ArchetypeSignatureTooltip>
							) : (
								t("Other {cardClass}", {
									cardClass: getHeroClassName(
										getCardClassName(
											data.opponentPlayerClass,
										),
										t,
									),
								})
							)}
						</p>
					</div>
					<div className="col-lg-2">
						{data.rank || data.legendRank ? (
							<>
								<RankIcon
									rank={data.rank}
									legendRank={data.legendRank}
									gameType={BnetGameType.BGT_RANKED_STANDARD}
								/>
								{data.rank
									? t("Rank {rank}", { rank: data.rank })
									: t("Legend {rank}", {
											rank: data.legendRank,
									  })}
							</>
						) : null}
					</div>
					<div className="col-lg-2">
						<SemanticAge date={data.date} />
					</div>
					<div className="col-lg-1">{data.numTurns}</div>
					<div className="col-lg-1">
						{t("{durationInMinutes} min", {
							durationInMinutes: formatNumber(
								data.duration / 1000 / 60,
								1,
							),
						})}
					</div>
					<div className="col-lg-2">
						{data.replayUrl ? (
							<a className="replay-link" href={data.replayUrl}>
								<span className="glyphicon glyphicon-triangle-right" />
							</a>
						) : null}
						{data.twitchVod ? (
							<a className="twitch-link" href={data.twitchVod}>
								<img src={image("socialauth/twitch.png")} />
							</a>
						) : null}
					</div>
				</div>
				<div className="clearfix" />
			</li>
		);
	}
}

export default translate()(ProfileReplayPanel);
