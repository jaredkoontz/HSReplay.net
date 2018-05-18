import _ from "lodash";
import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import CardData from "../../CardData";
import UserData from "../../UserData";
import { commaSeparate } from "../../helpers";
import { ArchetypeSignature } from "../../utils/api";
import CardList from "../CardList";
import { ClusterData, DeckData } from "./ClassAnalysis";
import ClusterSignature from "./ClusterSignature";

interface Props extends InjectedTranslateProps {
	cardData: CardData | null;
	clusterId: string;
	data?: ClusterData;
}

class ClusterDetail extends React.Component<Props> {
	public render(): React.ReactNode {
		const { cardData, clusterId, data, t } = this.props;
		const signature: ArchetypeSignature = {
			as_of: null,
			components: data.signatures[clusterId],
			format: null,
		};
		let adminData = null;
		if (UserData.hasFeature("archetype-training")) {
			const content = [];
			const decks = data.data.filter(
				d => "" + d.metadata.cluster_id === clusterId,
			);
			const totalGames = decks
				.map(d => d.metadata.games)
				.reduce((a, b) => a + b);
			const eligibleDecks = decks.filter(d => d.metadata.games > 1000)
				.length;
			content.push(
				<h2>{t("Cluster info")}</h2>,
				<table className="table">
					<tbody>
						<tr>
							<th>{t("Total games")}</th>
							<td>{commaSeparate(totalGames)}</td>
						</tr>
						<tr>
							<th>{t("Total decks")}</th>
							<td>{decks.length}</td>
						</tr>
						<tr>
							<th>{t("Eligible decks")}</th>
							<td>{eligibleDecks}</td>
						</tr>
					</tbody>
				</table>,
			);
			if (
				!_.isEmpty(data.ccp_signatures) &&
				!_.isEmpty(data.ccp_signatures[clusterId])
			) {
				const cppSignature: ArchetypeSignature = {
					as_of: null,
					components: data.ccp_signatures[clusterId],
					format: null,
				};
				content.push(
					<h2>{t("Weighted signature")}</h2>,
					<ClusterSignature
						cardData={cardData}
						signature={cppSignature}
					/>,
				);
			}
			adminData = (
				<div
					className="col-xs-12 col-sm-6 col-md-4"
					style={{ maxWidth: 400 }}
				>
					{content}
				</div>
			);
		}

		const clusterDecks = data.data.filter(
			d => "" + d.metadata.cluster_id === clusterId,
		);
		const deck = _.maxBy(clusterDecks, (x: DeckData) => x.metadata.games);
		const cardList = [];
		if (deck) {
			JSON.parse(deck.metadata.deck_list).forEach((c: any[]) => {
				for (let i = 0; i < c[1]; i++) {
					cardList.push(c[0]);
				}
			});
		}

		return (
			<div>
				<div
					className="col-xs-12 col-sm-6 col-md-4"
					style={{ maxWidth: 400 }}
				>
					<h2>{t("Signature")}</h2>
					<ClusterSignature
						cardData={cardData}
						signature={signature}
					/>
				</div>
				{adminData}
				<div
					className="col-xs-12 col-sm-6 col-md-4"
					style={{ maxWidth: 300 }}
				>
					<h2>{t("Most popular deck")}</h2>
					<p className="text-center">
						{t("{numGames} games", {
							numGames: deck.metadata.games,
						})}
					</p>
					<CardList
						cardData={cardData}
						cardList={cardList}
						name=""
						heroes={[]}
					/>
				</div>
			</div>
		);
	}
}
export default translate()(ClusterDetail);
