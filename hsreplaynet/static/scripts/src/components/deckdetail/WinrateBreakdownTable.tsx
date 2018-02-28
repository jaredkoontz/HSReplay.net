import React from "react";
import { SortDirection, TableData } from "../../interfaces";
import { toTitleCase, winrateData } from "../../helpers";
import SortableTable from "../SortableTable";

interface Props {
	opponentWinrateData?: TableData;
	deckListData?: TableData;
	deckId: string;
	playerClass: string;
}

interface State {
	sortBy?: string;
	sortDirection?: SortDirection;
}

export default class WinrateBreakdownTable extends React.Component<
	Props,
	State
> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			sortBy: "opponent",
			sortDirection: "ascending",
		};
	}

	public render(): React.ReactNode {
		const deck = this.props.deckListData.series.data[
			this.props.playerClass
		].find(x => x.deck_id === this.props.deckId);
		const baseWinrate = deck ? +deck.win_rate : 50;

		const winrateCell = (winrate: number) => {
			const wrData = winrateData(baseWinrate, winrate, 5);
			return (
				<td className="winrate-cell" style={{ color: wrData.color }}>
					{wrData.tendencyStr}
					{winrate.toFixed(2) + "%"}
				</td>
			);
		};

		const opponents = this.props.opponentWinrateData.series.data;
		const rows = [];
		Object.keys(opponents).forEach(opponent => {
			const oppData = opponents[opponent][0];
			if (oppData) {
				rows.push({ opponent, winrate: oppData.winrate });
			}
		});
		const direction = this.state.sortDirection === "ascending" ? 1 : -1;
		rows.sort(
			(a, b) =>
				a[this.state.sortBy] > b[this.state.sortBy]
					? direction
					: -direction,
		);
		const winrates = rows.map(row => {
			return (
				<tr>
					<td>
						<span
							className={
								"player-class " + row.opponent.toLowerCase()
							}
						>
							{toTitleCase(row.opponent)}
						</span>
					</td>
					{winrateCell(row.winrate)}
				</tr>
			);
		});

		const tableHeaders = [
			{
				sortKey: "opponent",
				text: "Opponent",
				defaultSortDirection: "ascending" as SortDirection,
			},
			{
				sortKey: "winrate",
				text: "Winrate",
				infoHeader: "Winrate",
				infoText: "Winrate of the deck versus the given opponent.",
			},
		];

		return (
			<SortableTable
				headers={tableHeaders}
				onSortChanged={(sortBy, sortDirection) =>
					this.setState({ sortBy, sortDirection })
				}
				sortBy={this.state.sortBy}
				sortDirection={this.state.sortDirection}
			>
				{winrates}
			</SortableTable>
		);
	}
}
