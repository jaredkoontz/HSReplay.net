import React from "react";
import { SortDirection, TableData, TableHeaderProps } from "../../interfaces";
import ClassFilter, { FilterOption } from "../ClassFilter";
import UserData from "../../UserData";
import PremiumWrapper from "../PremiumWrapper";
import CardData from "../../CardData";
import CardTile from "../CardTile";
import { winrateData } from "../../helpers";
import Pager from "../Pager";
import SortableTable from "../SortableTable";

interface Props {
	cardData: CardData;
	data?: TableData;
	opponentClass: string;
	setOpponentClass: (opponentClass: string) => void;
}

interface State {
	page: number;
	sortBy: string;
	sortDirection: SortDirection;
}

export default class AdaptDetail extends React.Component<Props, State> {
	private readonly numRows = 10;

	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			page: 1,
			sortBy: "popularity",
			sortDirection: "descending",
		};
	}

	public render(): React.ReactNode {
		let adaptations = 0;
		let totalRows = 0;
		const rows = [];
		const offset = (this.state.page - 1) * this.numRows;
		if (this.props.data && this.props.cardData) {
			const choices = this.props.data.series.data[
				this.props.opponentClass
			];
			if (choices) {
				totalRows = choices.length;
				const sortDir =
					this.state.sortDirection === "descending" ? 1 : -1;
				choices.sort(
					(a, b) =>
						(+b[this.state.sortBy] - +a[this.state.sortBy]) *
						sortDir,
				);
				const visibleChoices = choices.slice(
					offset,
					offset + this.numRows,
				);
				adaptations = Math.max.apply(
					Math,
					visibleChoices.map(choice => choice.adaptations.length),
				);
				visibleChoices.forEach((choice, index) => {
					const cards = [];
					choice.adaptations.forEach(dbfId => {
						const card = this.props.cardData.fromDbf(dbfId);
						cards.push(
							<td className="card-cell">
								<CardTile
									card={card}
									count={1}
									height={34}
									noLink
									customText={this.shortAdaptText(card)}
								/>
							</td>,
						);
					});
					for (let i = cards.length; i < adaptations; i++) {
						cards.push(<td />);
					}
					const wrData = winrateData(50, choice.win_rate, 2);
					const winrateCell = (
						<td style={{ color: wrData.color }}>
							{choice.win_rate + "%"}
						</td>
					);
					rows.push(
						<tr className="card-table-row">
							<td className="hidden-xs">
								{"#" + (offset + index + 1)}
							</td>
							{cards}
							{winrateCell}
							<td>{choice.popularity + "%"}</td>
						</tr>,
					);
				});
			}
		}

		const headers: TableHeaderProps[] = [
			{
				sortKey: "rank",
				text: "Rank",
				sortable: false,
				classNames: ["hidden-xs"],
			},
			{ sortKey: "adaptations", text: "Adaptations", sortable: false },
		];
		Array.from({ length: adaptations - 1 }, (x, index) =>
			headers.push({
				sortKey: "adaptations-" + index,
				text: "",
				sortable: false,
			}),
		);
		headers.push(
			{ sortKey: "win_rate", text: "Winrate" },
			{ sortKey: "popularity", text: "Popularity" },
		);

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
			<div className="container-fluid">
				<div className="row">
					<div className="opponent-filter-wrapper">
						<PremiumWrapper name="Single Card Adapt Opponent Selection">
							<h3>Opponent class</h3>
							<ClassFilter
								filters="All"
								hideAll
								minimal
								selectedClasses={[
									this.props.opponentClass as FilterOption,
								]}
								selectionChanged={selected =>
									UserData.isPremium() &&
									this.props.setOpponentClass(selected[0])
								}
							/>
						</PremiumWrapper>
					</div>
				</div>
				<div className="row">
					<div className="table-wrapper col-lg-12">
						{table}
						<div className="text-center">
							<Pager
								currentPage={this.state.page}
								setCurrentPage={(page: number) =>
									this.setState({ page })
								}
								pageCount={Math.ceil(totalRows / this.numRows)}
								minimal
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}

	shortAdaptText(card: any): string {
		switch (card.dbfId) {
			case 41060:
				return "Can't be targeted";
			case 41054:
				return "Stealth";
			case 41057:
				return "Deathrattle";
			default:
				return card.text.replace("<b>", "").replace("</b>", "");
		}
	}
}
