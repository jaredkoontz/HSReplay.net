import React from "react";
import { cardSorting, cleanText, slangToCardId } from "../helpers";
import ObjectSearch, { Limit } from "./ObjectSearch";
import CardTile from "./CardTile";

interface Props {
	availableCards: any[];
	id: string;
	onCardsChanged: (cards: any[]) => void;
	selectedCards: any[];
	label?: string;
	cardLimit?: Limit;
	onPaste?: (e: React.ClipboardEvent<EventTarget>) => void;
}

export default class CardSearch extends React.Component<Props> {
	public render(): React.ReactNode {
		return (
			<CardObjectSearch
				getFilteredObjects={query => this.getFilteredCards(query)}
				getMaxCount={card => this.getMaxCount(card)}
				getObjectElement={(card, count) =>
					this.getCardElement(card, count)
				}
				getObjectKey={card => card.id}
				id={this.props.id}
				label={this.props.label}
				noDataText="No cards found"
				objectLimit={
					this.props.cardLimit !== undefined
						? this.props.cardLimit
						: Limit.DOUBLE
				}
				onObjectsChanged={this.props.onCardsChanged}
				onPaste={this.props.onPaste}
				placeholder={
					this.props.onPaste
						? "Search for cards or paste deck…"
						: "Search for cards…"
				}
				selectedObjects={this.props.selectedCards}
				sorting={cardSorting}
			/>
		);
	}

	getFilteredCards(query: string): any[] {
		if (!this.props.availableCards) {
			return [];
		}
		if (!query) {
			return this.props.availableCards;
		}
		const cleanQuery = cleanText(query);
		if (!cleanQuery) {
			return [];
		}
		const resultSet = [];
		let availableCards = this.props.availableCards;
		const slang = slangToCardId(cleanQuery);
		if (slang !== null) {
			availableCards = availableCards.filter(card => {
				if (card.id === slang) {
					resultSet.push(card);
					return false;
				}
				return true;
			});
		}
		const filtered = availableCards.filter(card => {
			return cleanText(card.name).indexOf(cleanQuery) !== -1;
		});
		return resultSet.concat(filtered);
	}

	getCardElement(card: any, count: number): JSX.Element {
		return <CardTile card={card} count={count} height={34} noLink />;
	}

	getMaxCount(card: any): number {
		const limit = this.props.cardLimit || Limit.DOUBLE;
		return limit === Limit.DOUBLE
			? card.rarity === "LEGENDARY" ? 1 : 2
			: 0;
	}
}

// tslint:disable-next-line:max-classes-per-file
class CardObjectSearch extends ObjectSearch<any> {}
