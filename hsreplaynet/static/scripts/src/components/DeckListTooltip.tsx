import React from "react";
import CardData from "../CardData";
import Tooltip from "./Tooltip";
import { WithTranslation, withTranslation } from "react-i18next";
import CardList from "./CardList";

interface Props extends WithTranslation {
	cardData: CardData;
	deckName: string;
	gameType: string;
	cards: number[];
}

class DeckListTooltip extends React.Component<Props> {
	public render(): React.ReactNode {
		return (
			<Tooltip
				id="tooltip-deck-list"
				content={this.renderTooltip()}
				header={this.props.deckName}
				xOffset={50}
			>
				{this.props.children}
			</Tooltip>
		);
	}

	renderTooltip(): React.ReactNode {
		const { t } = this.props;
		return (
			<div>
				<CardList
					cardData={this.props.cardData}
					cardList={this.props.cards}
				/>
				<p>{t("Click to view deck")}</p>
			</div>
		);
	}
}

export default withTranslation()(DeckListTooltip);
