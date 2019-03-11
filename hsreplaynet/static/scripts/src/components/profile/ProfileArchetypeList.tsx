import React from "react";
import { Archetype } from "../../utils/api";
import CardData from "../../CardData";
import ProfileArchetypePanel from "./ProfileArchetypePanel";
import { CardClass } from "../../hearthstone";
import { WithTranslation, withTranslation } from "react-i18next";

interface Props extends WithTranslation {
	data: ProfileArchetypeData[];
	cardData: CardData;
	gameType: string;
}

export interface ProfileArchetypeData {
	archetype: Archetype | null;
	playerClass: string;
	numWins: number;
	globalWinrate: number | null;
	metaTier: number | null;
	numGames: number;
	lastPlayed: Date;
	decks: ProfileDeckData[];
}

export interface ProfileDeckData {
	numWins: number;
	globalWinrate: number | null;
	numGames: number;
	lastPlayed: Date;
	deckstring: string;
	archetype: Archetype;
	playerClass: string;
	metaTier: number | null;
	games: ProfileGameData[];
	deckUrl: string;
}

export interface ProfileGameData {
	won: boolean;
	opponentArchetype: Archetype | null;
	opponentPlayerClass: CardClass;
	rank: number | null;
	legendRank: number | null;
	numTurns: number;
	date: Date;
	duration: number;
	twitchVod: string | null;
	replayUrl: string | null;
}

class ProfileArchetypeList extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t } = this.props;
		return (
			<>
				<div className="profile-archetype-list-header hidden-sm hidden-xs">
					<div className="col-lg-1 col-md-1" />
					<div className="col-lg-2 col-md-2 align-left">
						{t("Archetype")}
					</div>
					<div className="col-lg-1 col-md-1">{t("Winrate")}</div>
					<div className="col-lg-1 col-md-1">{t("Games")}</div>
					<div className="col-lg-2 col-md-1">{t("Last Played")}</div>
					<div className="col-lg-5 col-md-6 align-left">
						{t("Cards")}
					</div>
				</div>
				<div className="clearfix" />
				<ul className="profile-archetype-list">
					{this.props.data.map(archetypeData => (
						<ProfileArchetypePanel
							data={archetypeData}
							cardData={this.props.cardData}
							gameType={this.props.gameType}
						/>
					))}
				</ul>
			</>
		);
	}
}

export default withTranslation()(ProfileArchetypeList);
