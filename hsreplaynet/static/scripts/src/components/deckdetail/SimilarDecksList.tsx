import React from "react";
import CardData from "../../CardData";
import { CardObj, DeckObj, TableData } from "../../interfaces";
import { Collection } from "../../utils/api";
import DeckList from "../DeckList";
import Fragments from "../Fragments";

interface Props {
	cardData?: CardData;
	data?: TableData;
	playerClass: string;
	rawCardList: string;
	wildDeck: boolean;
	collection?: Collection | null;
}

export default class SimilarDecksList extends React.Component<Props> {
	public render(): React.ReactNode {
		const dbfIds = this.props.rawCardList.split(",");

		const deckList = {};
		dbfIds.forEach(dbfId => (deckList[dbfId] = (deckList[dbfId] || 0) + 1));

		let byDistance = [];

		const classDecks = this.props.data.series.data[this.props.playerClass];

		// The distance here is the count of removed AND added cards.
		// So a distance of 12 corresponds to 6 changed cards.
		classDecks.forEach(deck => {
			let distance = 0;
			const cardList = JSON.parse(deck["deck_list"]);
			const removed = Object.assign({}, deckList);
			cardList.forEach(dbfIdCountPair => {
				distance += Math.abs(
					dbfIdCountPair[1] - (deckList[dbfIdCountPair[0]] || 0),
				);
				delete removed[dbfIdCountPair[0]];
			});
			Object.keys(removed).forEach(dbfId => (distance += removed[dbfId]));
			if (distance > 1 && distance <= 12) {
				byDistance.push({
					cards: cardList,
					deck,
					distance,
					numGames: +deck["total_games"],
				});
			}
		});

		if (!byDistance.length) {
			return <h3 className="message-wrapper">No deck found</h3>;
		}

		byDistance.sort((a, b) => a.distance - b.distance);
		byDistance = byDistance
			.slice(0, 20)
			.sort((a, b) => b.numGames - a.numGames);

		const decks: DeckObj[] = [];
		byDistance.forEach(deck => {
			const cards = deck.cards.map(c => {
				return { card: this.props.cardData.fromDbf(c[0]), count: c[1] };
			});
			// temporary hotfix to hide invalid decks
			if (cards.some(card => !card.card.collectible)) {
				return;
			}
			decks.push({
				archetypeId: deck.deck.archetype_id,
				cards,
				deckId: deck.deck["deck_id"],
				duration: +deck.deck["avg_game_length_seconds"],
				numGames: +deck.deck["total_games"],
				playerClass: this.props.playerClass,
				winrate: +deck.deck["win_rate"],
			});
		});

		const baseCards: CardObj[] = [];
		dbfIds.forEach(dbfId => {
			const card = this.props.cardData.fromDbf(dbfId);
			const existing = baseCards.find(c => c.card.dbfId === +dbfId);
			if (existing) {
				existing.count += 1;
			} else {
				baseCards.push({ card, count: 1 });
			}
		});

		return (
			<Fragments
				defaults={{
					sortBy: "popularity",
					sortDirection: "descending",
				}}
			>
				<DeckList
					decks={decks}
					pageSize={10}
					hideTopPager
					compareWith={baseCards}
					collection={this.props.collection}
					ads={[{ index: 3, ids: ["dd-d-7", "dd-d-8"] }]}
				/>
			</Fragments>
		);
	}
}
