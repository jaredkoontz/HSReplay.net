import React from "react";
import ProfileDeckPanel from "./ProfileDeckPanel";
import { decode as decodeDeckstring } from "deckstrings";
import { ProfileDeckData } from "./ProfileArchetypeList";
import CardData from "../../CardData";

interface Props {
	data: ProfileDeckData[];
	cardData: CardData;
	gameType: string;
}

export default class ProfileDeckList extends React.Component<Props> {
	public render(): React.ReactNode {
		const { data } = this.props;
		const commonCards = {};
		data.forEach(deck => {
			const deckDef = decodeDeckstring(deck.deckstring);
			deckDef.cards.forEach(([dbfId]) => {
				commonCards[dbfId] = (commonCards[dbfId] || 0) + 1;
			});
		});
		const cardUniqueness = Object.keys(commonCards).map(Number);
		cardUniqueness.sort(
			(a, b) => commonCards["" + a] - commonCards["" + b],
		);
		return (
			<ul className="col-lg-12">
				{data.map(deckData => (
					<ProfileDeckPanel
						data={deckData}
						cardData={this.props.cardData}
						cardUniqueness={cardUniqueness}
						gameType={this.props.gameType}
					/>
				))}
			</ul>
		);
	}
}
