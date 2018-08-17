import React from "react";
import CardData from "../../CardData";
import { Collection } from "../../utils/api";
import { DeckObj, TableData } from "../../interfaces";
import DeckList from "../DeckList";

interface Props {
	cardData?: CardData;
	data?: TableData;
	collection?: Collection | null;
}

export default class TrendingDecksList extends React.Component<Props> {
	public render(): React.ReactNode {
		const decks: DeckObj[] = [];
		const data = this.props.data.series.data;
		Object.keys(data).forEach(key => {
			if (!data[key].length) {
				return;
			}
			data[key].sort(
				(a, b) => +b["popularity_delta"] - +a["popularity_delta"],
			);
			const deck = data[key][0];
			const cards = JSON.parse(deck["deck_list"]);
			const deckList = cards.map(c => {
				return { card: this.props.cardData.fromDbf(c[0]), count: c[1] };
			});
			decks.push({
				archetypeId: deck.archetype_id,
				cards: deckList,
				deckId: deck["shortid"],
				duration: +deck["avg_game_length_seconds"],
				numGames: +deck["total_games"],
				playerClass: key,
				winrate: +deck["win_rate"],
			});
		});
		decks.sort((a, b) => (a.playerClass > b.playerClass ? 1 : -1));
		return (
			<DeckList
				decks={decks}
				pageSize={9}
				collection={this.props.collection}
				hideTopPager
				ads={[
					{ index: 3, ids: ["tr-d-3", "tr-d-4"] },
					{ index: 3, ids: ["tr-m-2"], mobile: true },
				]}
			/>
		);
	}
}
