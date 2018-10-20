import React from "react";
import { Archetype } from "../../utils/api";
import CardData from "../../CardData";
import ProfileArchetypePanel from "./ProfileArchetypePanel";
import { CardClass } from "../../hearthstone";

interface Props {
	data: ProfileArchetypeData[];
	cardData: CardData;
}

export interface ProfileArchetypeData {
	archetype: Archetype;
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
	metaTier: number | null;
	games: ProfileGameData[];
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
	replay: string | null;
}

interface State {}

export default class ProfileArchetypeList extends React.Component<
	Props,
	State
> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {};
	}

	public render(): React.ReactNode {
		return (
			<ul className="profile-archetype-list">
				{this.props.data.map(archetypeData => (
					<ProfileArchetypePanel
						data={archetypeData}
						cardData={this.props.cardData}
					/>
				))}
			</ul>
		);
	}
}
