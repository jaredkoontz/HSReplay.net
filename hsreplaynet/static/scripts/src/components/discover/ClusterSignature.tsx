import React from "react";
import CardTable from "../tables/CardTable";
import { ApiArchetypeSignature, SortDirection } from "../../interfaces";
import CardData from "../../CardData";
import { toDynamicFixed } from "../../helpers";

interface ClusterSignatureState {
	sortBy: string;
	sortDirection: SortDirection;
}

interface ClusterSignatureProps
	extends React.ClassAttributes<ClusterSignature> {
	cardData: CardData | null;
	signature?: ApiArchetypeSignature;
}

export default class ClusterSignature extends React.Component<
	ClusterSignatureProps,
	ClusterSignatureState
> {
	constructor(props: ClusterSignatureProps, state: ClusterSignatureState) {
		super(props, state);
		this.state = {
			sortBy: "prevalence",
			sortDirection: "descending"
		};
	}

	render(): JSX.Element {
		const { cardData, signature } = this.props;

		if (!cardData) {
			return <div className="text-center">Loading cards…</div>;
		}

		const cards = [];
		const prevalences = [];

		signature.components.forEach(([dbfId, prevalence]) => {
			cards.push({ card: cardData.fromDbf(dbfId), count: 1 });
			prevalences.push({
				dbf_id: dbfId,
				prevalence: toDynamicFixed(prevalence, 3)
			});
		});
		return (
			<CardTable
				cards={cards}
				data={prevalences}
				columns={["prevalence"]}
				sortBy={this.state.sortBy}
				sortDirection={this.state.sortDirection}
				onSortChanged={(sortBy, sortDirection) =>
					this.setState({ sortBy, sortDirection })
				}
				numCards={signature.components.length}
				minColumnWidth={100}
				headerWidth={[150, 300]}
				headerWidthRatio={0.66}
			/>
		);
	}
}
