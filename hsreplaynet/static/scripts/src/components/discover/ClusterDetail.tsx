import React from "react";
import CardData from "../../CardData";
import { ApiArchetypeSignature } from "../../interfaces";
import { ClusterData, DeckData } from "./ClassAnalysis";
import * as _ from "lodash";
import CardList from "../CardList";
import ClusterSignature from "./ClusterSignature";
import { commaSeparate } from "../../helpers";
import UserData from "../../UserData";

interface Props {
	cardData: CardData | null;
	clusterId: string;
	data?: ClusterData;
}

export default class ClusterDetail extends React.Component<Props> {
	public render(): React.ReactNode {
		const { cardData, clusterId, data } = this.props;
		const signature: ApiArchetypeSignature = {
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
				<h2>Cluster Info</h2>,
				<table className="table">
					<tbody>
						<tr>
							<th>Total Games</th>
							<td>{commaSeparate(totalGames)}</td>
						</tr>
						<tr>
							<th>Total Decks</th>
							<td>{decks.length}</td>
						</tr>
						<tr>
							<th>Eligible Decks</th>
							<td>{eligibleDecks}</td>
						</tr>
					</tbody>
				</table>,
			);
			if (
				!_.isEmpty(data.ccp_signatures) &&
				!_.isEmpty(data.ccp_signatures[clusterId])
			) {
				const cppSignature: ApiArchetypeSignature = {
					as_of: null,
					components: data.ccp_signatures[clusterId],
					format: null,
				};
				content.push(
					<h2>Weighted Signature</h2>,
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
					<h2>Signature</h2>
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
					<h2>Most Popular Deck</h2>
					<p className="text-center">{deck.metadata.games} games</p>
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
