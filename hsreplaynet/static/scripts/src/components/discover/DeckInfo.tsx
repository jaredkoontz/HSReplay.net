import React from "react";
import CardData from "../../CardData";
import CardList from "../CardList";
import DataInjector from "../DataInjector";
import { ClusterMetaData } from "./ClassAnalysis";
import UserData from "../../UserData";

interface Props {
	cardData: CardData | null;
	clusterColor: string;
	deck: ClusterMetaData;
	format: string;
	height: string;
	playerClass: string;
}

export default class DeckInfo extends React.Component<Props> {
	public render(): React.ReactNode {
		const {
			cardData,
			clusterColor,
			deck,
			height,
			playerClass
		} = this.props;
		const infoboxClassNames = ["infobox"];

		let content = null;
		if (deck === null) {
			infoboxClassNames.push("no-deck");
			content = (
				<div className="no-deck-message">
					<p>
						<strong>Hover</strong> any deck for more details.<br />
						<strong>Click</strong> any deck to focus/defocus it.
					</p>
				</div>
			);
		} else {
			const cardList = [];
			// hotfix for unload issue 2017-09-24
			const fixedDeckList = (deck.deck_list || "").replace(/\\,/g, ",");
			JSON.parse(fixedDeckList).forEach((c: any[]) => {
				for (let i = 0; i < c[1]; i++) {
					cardList.push(c[0]);
				}
			});
			content = [
				<h1 key="title">
					<span
						className="signature-label"
						style={{ backgroundColor: clusterColor }}
					/>
					{deck.cluster_name}
				</h1>,
				<CardList
					key="decklist"
					cardData={cardData}
					cardList={cardList}
					name=""
					heroes={[]}
				/>,
				<a
					key="deck-detail-link"
					className="btn btn-primary btn-deck-details"
					href={`/decks/${deck.shortid}/`}
				>
					View Deck Details
				</a>,
				<h2 key="data-header">Data</h2>,
				<ul key="data-list">
					<li>
						Games
						<span className="infobox-value">{deck.games}</span>
					</li>
				</ul>
			];
		}

		return (
			<div
				id="infobox-deck"
				className={infoboxClassNames.join(" ")}
				style={{ height }}
			>
				{content}
			</div>
		);
	}
}
