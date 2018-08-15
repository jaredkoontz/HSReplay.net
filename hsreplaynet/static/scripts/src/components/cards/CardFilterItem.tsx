import React from "react";
import InfoboxFilter from "../InfoboxFilter";
import { CardFilterConsumer } from "./CardFilterManager";
import { CardFilterItemGroupConsumer } from "./CardFilterItemGroup";
import { CardData as Card } from "hearthstonejson-client";

interface Props {
	value: string;
	className?: string;
	noCount?: boolean;
}

class CardFilterItem extends React.Component<Props> {
	public render(): React.ReactNode {
		return (
			<CardFilterItemGroupConsumer>
				{({ filterFactory, collection }) => (
					<CardFilterConsumer>
						{({ cardData, dbfIds }) => {
							let collectionCount = null;
							let total = null;
							if (cardData) {
								const cards = dbfIds.map(dbfId =>
									cardData.fromDbf(dbfId),
								);
								const matchingCards = cards.filter(
									filterFactory(this.props.value),
								);
								if (collection) {
									total = matchingCards.reduce(
										(count, card) =>
											count + this.maxCount(card),
										0,
									);

									collectionCount = matchingCards.reduce(
										(count, card) =>
											count +
											(collection.collection[
												card.dbfId
											][0] +
											collection.collection[card.dbfId][1]
												? this.maxCount(card)
												: 0),
										0,
									);
								} else {
									total = matchingCards.length;
								}
							}

							return (
								<InfoboxFilter
									value={this.props.value}
									disabled={total === 0}
									className={this.props.className}
								>
									{this.props.children}
									{!this.props.noCount && total !== null ? (
										<span className="infobox-value">
											{collectionCount !== null ? (
												<>
													{collectionCount} / {total}
												</>
											) : (
												total
											)}
										</span>
									) : null}
								</InfoboxFilter>
							);
						}}
					</CardFilterConsumer>
				)}
			</CardFilterItemGroupConsumer>
		);
	}

	private maxCount = (card: Card) => (card.rarity === "LEGENDARY" ? 1 : 2);
}

export default CardFilterItem;
