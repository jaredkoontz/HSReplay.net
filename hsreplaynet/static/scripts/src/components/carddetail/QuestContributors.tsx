import React from "react";
import { InjectedTranslateProps, Trans, translate } from "react-i18next";
import CardData from "../../CardData";
import { toDynamicFixed, winrateData } from "../../helpers";
import { SortDirection, TableData, TableHeaderProps } from "../../interfaces";
import CardTile from "../CardTile";
import Pager from "../Pager";
import SortableTable from "../SortableTable";

interface Props extends InjectedTranslateProps {
	cardData: CardData;
	data?: TableData;
}

interface State {
	page: number;
	sortBy: string;
	sortDirection: SortDirection;
}

class QuestContributors extends React.Component<Props, State> {
	private readonly numRows = 15;

	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			page: 1,
			sortBy: "popularity",
			sortDirection: "descending",
		};
	}

	public render(): React.ReactNode {
		const { t } = this.props;
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
				text: t("Contributor"),
				sortable: false,
				infoHeader: t("Contributor"),
				infoText: (
					<Trans>
						<p>
							Cards that contributed to the completion of this
							quest in some way.
						</p>
						<br />
						<strong>Created cards:</strong>
						<p>
							Created cards count towards their source: e.g.
							Fireballs created by Archmage Antonidas will count
							towards the Archmage, rather than Fireball.
						</p>
						<br />
						<strong>The Caverns Below (Rogue):</strong>
						<p>
							All progress ticks are included, not just the ones
							that eventually complete the Quest.
						</p>
					</Trans>
				),
			},
			{
				sortKey: "win_rate",
				text: t("Played winrate"),
				infoHeader: t("Played winrate"),
				infoText: t(
					"Average winrate of games where the card contributed to the quest.",
				),
			},
			{
				sortKey: "popularity",
				text: t("Popularity"),
				infoHeader: t("Popularity"),
				infoText: t(
					"Total percentage of quest progress made by the card.",
				),
			},
			{
				sortKey: "median_turn_completed",
				text: t("Median turn"),
				infoHeader: t("Median turn completed"),
				infoText: t(
					"Turn this quest is most commonly completed on when the card contributed the progress.",
				),
			},
			{
				sortKey: "quest_completion_frequency",
				text: t("Completed"),
				infoHeader: t("Completion frequency"),
				infoText: t(
					"Frequency of this quest being completed when the card contributed to the progress.",
				),
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
export default translate()(QuestContributors);
