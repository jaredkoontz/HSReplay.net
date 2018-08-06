import React from "react";
import { InjectedTranslateProps, Trans, translate } from "react-i18next";
import CardData from "../../CardData";
import CardList from "../CardList";
import { ClusterMetaData } from "./ClassAnalysis";

interface Props extends InjectedTranslateProps {
	cardData: CardData | null;
	clusterColor: string;
	deck: ClusterMetaData;
	format: string;
	height: string;
	playerClass: string;
}

class DeckInfo extends React.Component<Props> {
	public render(): React.ReactNode {
		const {
			cardData,
			clusterColor,
			deck,
			height,
			playerClass,
			t,
		} = this.props;
		const infoboxClassNames = ["infobox"];

		let content = null;
		if (deck === null) {
			infoboxClassNames.push("no-deck");
			content = (
				<div className="no-deck-message">
					<p>
						<Trans>
							<strong>Hover</strong> any deck for more details.<br />
							<strong>Click</strong> any deck to focus/unfocus it.
						</Trans>
					</p>
				</div>
			);
		} else {
			const cardList = [];
			JSON.parse(deck.deck_list || "").forEach((c: any[]) => {
				for (let i = 0; i < c[1]; i++) {
					cardList.push(c[0]);
				}
			});
			content = (
				<>
					<h1>
						<span
							className="signature-label"
							style={{ backgroundColor: clusterColor }}
						/>
						{deck.cluster_name}
					</h1>
					<CardList
						cardData={cardData}
						cardList={cardList}
						name=""
						heroes={[]}
					/>
					<a
						className="btn btn-primary btn-deck-details"
						href={`/decks/${deck.shortid}/`}
					>
						{t("View deck details")}
					</a>
					<h2>{t("Data")}</h2>
					<ul>
						<li>
							{t("Games")}
							<span className="infobox-value">{deck.games}</span>
						</li>
					</ul>
				</>
			);
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
export default translate()(DeckInfo);
