import _ from "lodash";
import React, { Fragment } from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import CardData from "../../CardData";
import UserData from "../../UserData";
import { ArchetypeSignature } from "../../utils/api";
import CardList from "../CardList";
import { ClusterData, DeckData } from "./ClassAnalysis";
import ClusterSignature from "./ClusterSignature";
import { formatNumber } from "../../i18n";
import { fetchCSRF } from "../../helpers";

interface Props extends InjectedTranslateProps {
	cardData: CardData | null;
	clusterId: string;
	data?: ClusterData;
	format: string;
	playerClass: string;
	requestReload: () => void;
}

class ClusterDetail extends React.Component<Props> {
	public shouldComponentUpdate(
		nextProps: Readonly<Props>,
		nextState: Readonly<{}>,
		nextContext: any,
	): boolean {
		return (
			nextProps.clusterId !== this.props.clusterId ||
			nextProps.cardData !== this.props.cardData ||
			nextProps.data !== this.props.data
		);
	}

	private onArchetypeMergeClick(event: any, targetArchetypeId: number) {
		event.preventDefault();
		this.setState({ working: true });
		const headers = new Headers();
		const { clusterId, format, playerClass } = this.props;
		headers.set("content-type", "application/json");
		fetchCSRF(`/clusters/latest/${format}/${playerClass}/${clusterId}/`, {
			body: JSON.stringify({ archetype_id: targetArchetypeId }),
			credentials: "same-origin",
			headers,
			method: "PATCH",
		})
			.then((response: Response) => {
				if (!response.ok) {
					console.error(response.toString());
				} else {
					this.props.requestReload();
				}
				this.setState({ working: false });
			})
			.catch(reason => {
				console.error(reason);
				this.setState({ working: false });
			});
	}

	// This similarity calculation is borrowed from the Python implementation
	// in hsarchetypes.clustering.

	private computeSimilarity(
		c1: Array<[number, number]>,
		c2: Array<[number, number]>,
	) {
		const similarityFilter = value => value[1] > 0.25;

		const c1_card_map = new Map(c1.filter(similarityFilter));
		const c2_card_map = new Map(c2.filter(similarityFilter));
		const c1_cards = new Set(c1_card_map.keys());
		const c2_cards = new Set(c2_card_map.keys());

		const union = new Set([...c1_cards, ...c2_cards]);
		const intersection = new Set(
			[...c1_cards].filter(x => c2_cards.has(x)),
		);

		const values = new Map<number, number>();
		const intersectionValues = new Map<number, number>();

		union.forEach(c => {
			if (c1_cards.has(c) && c2_cards.has(c)) {
				const c1Value = c1_card_map.get(c);
				const c2Value = c2_card_map.get(c);
				const unionVal = (c1Value + c2Value) / 2;

				values.set(c, unionVal);

				const maxVal = Math.max(c1Value, c2Value);
				const absDiff = Math.abs(c1Value - c2Value);
				const intersectionModifier = (maxVal - absDiff) / maxVal;

				intersectionValues.set(c, intersectionModifier * unionVal);
			} else if (c1_cards.has(c)) {
				values.set(c, c1_card_map.get(c));
			} else {
				values.set(c, c2_card_map.get(c));
			}
		});

		let wIntersection = 0.0;
		intersection.forEach(c => {
			wIntersection += intersectionValues.get(c);
		});

		let wUnion = 0.0;
		union.forEach(c => {
			wUnion += values.get(c);
		});

		return wIntersection / wUnion;
	}

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
				<Fragment key="cluster-info">
					<h2>{t("Cluster info")}</h2>
					<table className="table">
						<tbody>
							<tr>
								<th>{t("Total games")}</th>
								<td>{formatNumber(totalGames)}</td>
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
					</table>
				</Fragment>,
			);

			// Does the cluster have an archetype label? If so, render the
			// weighted signature...

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
					<Fragment key="weighted-signature">
						<h2>{t("Weighted signature")}</h2>
						<ClusterSignature
							cardData={cardData}
							clusterId={clusterId}
							format={this.props.format}
							playerClass={this.props.playerClass}
							requiredCards={
								data.cluster_required_cards[clusterId]
							}
							requestReload={this.props.requestReload}
							signature={cppSignature}
						/>
					</Fragment>,
				);
			} else if (clusterId != "-1") {
				// Otherwise, render the table of labeled clusters so the
				// archetype supervisor can choose to merge this cluster into
				// one of them if appropriate.

				const labeledClusters = [];
				for (const k in data.cluster_names) {
					const similarity = this.computeSimilarity(
						data.signatures[clusterId],
						data.signatures[k],
					);

					labeledClusters.push({
						id: k,
						similarity,
					});
				}

				// Sort related clusters by similarity, descending.

				labeledClusters.sort(
					(a, b) => b["similarity"] - a["similarity"],
				);

				// Generate the list of table rows.

				const tableRows = [];
				labeledClusters
					.slice(0, 4) // Limit table to four rows.
					.forEach(labeledCluster => {
						const similarity: number = labeledCluster["similarity"];
						const targetArchetypeId: number =
							data.cluster_map[labeledCluster["id"]];

						tableRows.push(
							<tr>
								<td className="align-middle">
									{data.cluster_names[labeledCluster["id"]]}
								</td>
								<td>{similarity.toPrecision(3)}</td>
								<td>
									<a
										href="#"
										className="btn btn-success"
										onClick={e =>
											this.onArchetypeMergeClick(
												e,
												targetArchetypeId,
											)
										}
									>
										{"Merge"}
									</a>
								</td>
							</tr>,
						);
					});

				content.push(
					<Fragment key="labeled-clusters">
						<h2>{"Labeled clusters"}</h2>
						<table className="table">
							<tbody>{tableRows}</tbody>
						</table>
					</Fragment>,
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
						clusterId={clusterId}
						format={this.props.format}
						playerClass={this.props.playerClass}
						requestReload={this.props.requestReload}
						requiredCards={data.cluster_required_cards[clusterId]}
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
