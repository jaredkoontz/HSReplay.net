import React from "react";
import { SortDirection, TableData, TableHeaderProps } from "../../interfaces";
import CardData from "../../CardData";
import CardTile from "../CardTile";
import { toDynamicFixed, winrateData } from "../../helpers";
import Pager from "../Pager";
import SortableTable from "../SortableTable";

interface Props {
	cardData: CardData;
	data?: TableData;
}

interface State {
	page: number;
	sortBy: string;
	sortDirection: SortDirection;
}

export default class QuestContributors extends React.Component<Props, State> {
	private readonly numRows = 15;

	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			page: 1,
			sortBy: "popularity",
			sortDirection: "descending",
		};
	}

	public render(): React.ReactNode {
		let totalRows = 0;
		const rows = [];
		const offset = (this.state.page - 1) * this.numRows;
		if (this.props.data && this.props.cardData) {
			const contributors = this.props.data.series.data["ALL"];
			totalRows = contributors.length;
			const sortDir = this.state.sortDirection === "descending" ? 1 : -1;
			contributors.sort(
				(a, b) =>
					(+b[this.state.sortBy] - +a[this.state.sortBy]) * sortDir,
			);
			contributors
				.slice(offset, offset + this.numRows)
				.forEach((contributor, index) => {
					const wrData = winrateData(50, contributor.win_rate, 2);
					const winrateCell = (
						<td style={{ color: wrData.color }}>
							{contributor.win_rate.toFixed(2) + "%"}
						</td>
					);
					const card = this.props.cardData.fromDbf(
						contributor.dbf_id,
					);
					rows.push(
						<tr className="card-table-row">
							<td className="card-cell">
								<CardTile card={card} count={1} height={34} />
							</td>
							{winrateCell}
							<td>
								{toDynamicFixed(contributor.popularity, 2) +
									"%"}
							</td>
							<td>{contributor.median_turn_completed}</td>
							<td>
								{contributor.quest_completion_frequency.toFixed(
									2,
								) + "%"}
							</td>
						</tr>,
					);
				});
		}

		const headers: TableHeaderProps[] = [
			{
				sortKey: "card",
				text: "Contributor",
				sortable: false,
				infoHeader: "Contributor",
				infoText: (
					<>
						<p>
							Cards that contributed to the completion of this
							quest in some way.
						</p>
						<br />
						<strong>Created cards:</strong>,
						<p>
							Created cards count towards their source: e.g.
							Fireballs created by Archmage Antonidas will count
							towards the Archmage, rather than Fireball.
						</p>
						<br />
						<strong>The Caverns Below (Rogue):</strong>,
						<p>
							All progress ticks are included, not just the ones
							that eventually complete the Quest.
						</p>
					</>
				),
			},
			{
				sortKey: "win_rate",
				text: "Played Winrate",
				infoHeader: "Played Winrate",
				infoText:
					"Average winrate of games where the card contributed to the quest.",
			},
			{
				sortKey: "popularity",
				text: "Popularity",
				infoHeader: "Popularity",
				infoText:
					"Total percentage of quest progress made by the card.",
			},
			{
				sortKey: "median_turn_completed",
				text: "Median Turn",
				infoHeader: "Median Turn Completed",
				infoText:
					"Turn this quest is most commonly completed on when the card contributed the progress.",
			},
			{
				sortKey: "quest_completion_frequency",
				text: "Completed",
				infoHeader: "Completion Frequency",
				infoText:
					"Frequency of this quest being completed when the card contributed to the progress.",
			},
		];

		const table = (
			<SortableTable
				headers={headers}
				sortBy={this.state.sortBy}
				sortDirection={this.state.sortDirection}
				onSortChanged={(sortBy, sortDirection) =>
					this.setState({ sortBy, sortDirection })
				}
			>
				{rows}
			</SortableTable>
		);

		return (
			<div className="table-wrapper">
				{table}
				<div className="text-center">
					<Pager
						currentPage={this.state.page}
						setCurrentPage={(page: number) =>
							this.setState({ page })
						}
						pageCount={Math.ceil(totalRows / this.numRows)}
					/>
				</div>
			</div>
		);
	}
}
