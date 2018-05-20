import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import CardData from "../../CardData";
import UserData from "../../UserData";
import { winrateData } from "../../helpers";
import { SortDirection, TableData, TableHeaderProps } from "../../interfaces";
import CardTile from "../CardTile";
import ClassFilter, { FilterOption } from "../ClassFilter";
import Pager from "../Pager";
import SortableTable from "../SortableTable";
import PremiumWrapper from "../premium/PremiumWrapper";

interface Props extends InjectedTranslateProps {
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

class AdaptDetail extends React.Component<Props, State> {
	private readonly numRows = 10;

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
				text: t("Rank"),
				sortable: false,
				classNames: ["hidden-xs"],
			},
			{ sortKey: "adaptations", text: t("Adaptations"), sortable: false },
		];
		Array.from({ length: adaptations - 1 }, (x, index) =>
			headers.push({
				sortKey: "adaptations-" + index,
				text: "",
				sortable: false,
			}),
		);
		headers.push(
			{ sortKey: "win_rate", text: t("Winrate") },
			{ sortKey: "popularity", text: t("Popularity") },
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
						<PremiumWrapper analyticsLabel="Single Card Adapt Opponent Selection">
							<h3>{t("Opponent class")}</h3>
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
		const { t } = this.props;
		switch (card.dbfId) {
			case 41060:
			case 41054:
			case 41057:
				return card.name;
			default:
				return card.text.replace(/<\/?b>/g, "");
		}
	}
}
export default translate()(AdaptDetail);
