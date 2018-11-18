import React from "react";
import CardTable from "../tables/CardTable";
import { SortDirection } from "../../interfaces";
import CardData from "../../CardData";
import { ArchetypeSignature } from "../../utils/api";
import LoadingSpinner from "../LoadingSpinner";
import { CardTableColumnKey } from "../tables/cardtable/CardTableColumns";
import { fetchCSRF } from "../../helpers";

interface Props {
	cardData: CardData | null;
	clusterId: string;
	format: string;
	playerClass: string;
	requestReload: () => void;
	requiredCards: number[];
	showRequiredCards?: boolean;
	signature?: ArchetypeSignature;
}

interface State {
	sortBy: string;
	sortDirection: SortDirection;
	working: boolean;
}

export default class ClusterSignature extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			sortBy: "prevalence",
			sortDirection: "descending",
			working: false,
		};
	}

	private onCardRequiredClick(dbfId: number) {
		const dbfIndex = this.props.requiredCards.indexOf(dbfId);
		const method = dbfIndex !== -1 ? "DELETE" : "PUT";

		this.setState({
			working: true,
		});

		const { clusterId, format, playerClass } = this.props;

		fetchCSRF(
			`/clusters/latest/${format}/${playerClass}/${clusterId}/${dbfId}/`,
			{
				credentials: "same-origin",
				method,
			},
		)
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

	public render(): React.ReactNode {
		const { cardData, signature } = this.props;

		if (!cardData) {
			return <LoadingSpinner active />;
		}

		const cards = [];
		const data = [];
		const columns: CardTableColumnKey[] = ["prevalence"];

		if (this.props.showRequiredCards) {
			columns.push("requiredForArchetype");
		}

		signature.components.forEach(([dbfId, prevalence]) => {
			cards.push({ card: cardData.fromDbf(dbfId), count: 1 });

			const rowData = {
				dbf_id: dbfId,
				prevalence,
			};

			if (this.props.showRequiredCards) {
				const required_card = this.props.requiredCards.includes(dbfId);
				rowData["required_for_archetype"] = (
					<input
						checked={required_card}
						onChange={() => {
							this.onCardRequiredClick(dbfId);
						}}
						type={"checkbox"}
					/>
				);
			}

			data.push(rowData);
		});

		return (
			<CardTable
				cards={cards}
				data={data}
				columns={columns}
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
