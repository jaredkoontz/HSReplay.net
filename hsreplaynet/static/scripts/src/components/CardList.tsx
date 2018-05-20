import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import CardData from "../CardData";
import { cardSorting } from "../helpers";
import { Collection } from "../utils/api";
import { isMissingCardFromCollection } from "../utils/collection";
import CardTile from "./CardTile";
import CopyDeckButton from "./CopyDeckButton";

type CardId = string | number;

interface Props extends InjectedTranslateProps {
	cardData: CardData | null;
	cardList: CardId[];
	predictedCardList?: CardId[];
	cardHeight?: number;
	name?: string;
	heroes?: number[];
	showButton?: boolean;
	id?: number;
	deckClass?: string;
	format?: number;
	customCounts?: { [dbfId: number]: number };
	sortByCount?: boolean;
	collection?: Collection | null;
}

class CardList extends React.Component<Props> {
	cardCounts(cards: CardId[]): any {
		if (!cards) {
			return [];
		}
		const counts = {};
		cards.forEach(id => (counts[id] = (counts[id] || 0) + 1));
		return counts;
	}

	public render(): React.ReactNode {
		const { t } = this.props;
		if (!this.props.cardList) {
			return null;
		}
		if (!this.props.cardData) {
			return <div className="text-center">{t("Loading cards…")}</div>;
		}

		const { cardData, cardList, customCounts, sortByCount } = this.props;

		const predictedCardList = this.props.predictedCardList;

		const counts = this.cardCounts(cardList);
		const predictedCounts = this.cardCounts(predictedCardList);

		const cardCounts = {};
		if (predictedCardList) {
			Object.keys(predictedCounts).forEach(cardId => {
				const actualCount = counts[cardId] || 0;
				cardCounts[cardId] = {
					count: actualCount,
					predicted: predictedCounts[cardId] - actualCount,
				};
			});
		} else {
			Object.keys(counts).forEach(cardId => {
				cardCounts[cardId] = {
					count: counts[cardId],
					predicted: 0,
				};
			});
		}

		const dbfIds = typeof this.props.cardList[0] === "number";
		const getCard = id =>
			dbfIds ? cardData.fromDbf(id) : cardData.fromCardId(id);

		const cards = Object.keys(cardCounts).map(getCard);
		if (sortByCount) {
			cards.sort((a, b) => customCounts[b.dbfId] - customCounts[a.dbfId]);
		} else {
			cards.sort(cardSorting);
		}

		const copyButtonCards = [];
		const cardTiles = [];

		const cardHeight = this.props.cardHeight || 34;

		cards.forEach(card => {
			if (!card) {
				return;
			}
			const count = cardCounts[dbfIds ? card.dbfId : card.id];

			for (let i = 0; i < count.count + count.predicted; i++) {
				copyButtonCards.push(card.dbfId);
			}

			const addTile = (tileCount: number, predicted: boolean) => {
				cardTiles.push(
					<CardTile
						card={card}
						count={
							customCounts ? customCounts[card.dbfId] : tileCount
						}
						height={cardHeight}
						countBoxSize={customCounts && 50}
						predicted={predicted}
						subtitle={predicted ? t("Predicted Card") : null}
						key={dbfIds ? card.dbfId : card.id}
						craftable={isMissingCardFromCollection(
							this.props.collection,
							card.dbfId,
							tileCount,
						)}
					/>,
				);
			};

			if (count.count > 0) {
				addTile(count.count, false);
			}
			if (count.predicted > 0) {
				addTile(count.predicted, true);
			}
		});

		return (
			<div>
				<ul className="card-list">{cardTiles}</ul>
				{this.props.showButton &&
				cardTiles.length > 0 &&
				this.props.deckClass ? (
					<div className="text-center copy-deck-wrapper">
						<CopyDeckButton
							cardData={this.props.cardData}
							cards={copyButtonCards}
							heroes={this.props.heroes}
							format={this.props.format}
							deckClass={this.props.deckClass}
							name={this.props.name}
							sourceUrl={
								window && window.location
									? window.location.toString().split("#")[0]
									: undefined
							}
						/>
					</div>
				) : null}
			</div>
		);
	}
}

export default translate()(CardList);
