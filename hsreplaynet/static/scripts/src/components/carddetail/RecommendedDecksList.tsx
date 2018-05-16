import React from "react";
import CardData from "../../CardData";
import { DeckObj, TableData } from "../../interfaces";
import { Collection } from "../../utils/api";
import DeckList from "../DeckList";
import Fragments from "../Fragments";

interface Props {
	card: any;
	cardData: CardData;
	data?: TableData;
	collection: Collection | null;
}

export default class RecommendedDecksList extends React.Component<Props> {
	public render(): React.ReactNode {
		const decks: DeckObj[] = [];
		const data = this.props.data.series.data;

		Object.keys(data).forEach(playerClass => {
			const classDecks = [];
			data[playerClass].forEach(deck => {
				const cards = JSON.parse(deck["deck_list"]);
				if (cards.some(pair => pair[0] === this.props.card.dbfId)) {
					classDecks.push({
						cards,
						deck,
						numGames: +deck["total_games"],
					});
				}
			});
			classDecks.slice(0, 10).forEach(deck => {
				const cardData = deck.cards.map(c => {
					return {
						card: this.props.cardData.fromDbf(c[0]),
						count: c[1],
					};
				});
				decks.push({
					archetypeId: deck.deck.archetype_id,
					cards: cardData,
					deckId: deck.deck["deck_id"],
					duration: +deck.deck["avg_game_length_seconds"],
					numGames: +deck.deck["total_games"],
					playerClass,
					winrate: +deck.deck["win_rate"],
				});
			});
		});

		if (!decks.length) {
			return <h3 className="message-wrapper">No deck found</h3>;
		}

		return (
			<Fragments
				defaults={{
					sortBy: "popularity",
					sortDirection: "descending",
					page: 1,
				}}
			>
				<DeckList
					decks={decks}
					pageSize={10}
					collection={this.props.collection}
					hideTopPager
				/>
			</Fragments>
		);
	}
}
