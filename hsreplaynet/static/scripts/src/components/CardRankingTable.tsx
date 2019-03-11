import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import CardData from "../CardData";
import { TableData } from "../interfaces";
import CardRankingTableRow from "./CardRankingTableRow";
import Pager from "./Pager";

interface TooltipMap<T> {
	rank?: T;
	card?: T;
	popularity?: T;
	winrate?: T;
}

interface Props extends WithTranslation {
	data?: TableData;
	dataKey: string;
	cardData: CardData;
	numRows: number;
	tooltips?: TooltipMap<React.ReactNode>;
}

interface State {
	page: number;
}

class CardRankingTable extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			page: 1,
		};
	}

	public render(): React.ReactNode {
		const { t } = this.props;
		const tableRows = this.props.data.series.data[this.props.dataKey];
		const hasWinrate = tableRows[0] && tableRows[0].win_rate;
		const rowCount = tableRows.length;
		tableRows.sort((a, b) => +b.popularity - +a.popularity);
		const cardRows = tableRows
			.slice(
				(this.state.page - 1) * this.props.numRows,
				this.state.page * this.props.numRows,
			)
			.map((row, index) => {
				const isFace = !!row["is_opponent_hero"];
				const isNoTarget = +row.dbf_id === -1 && !isFace;
				const card = this.props.cardData.fromDbf(
					isFace ? 39770 : isNoTarget ? 1674 : row.dbf_id,
				);
				if (isNoTarget) {
					card.cost = null;
				}
				const popularity = +row.popularity;
				if (isNaN(popularity) || !popularity) {
					return;
				}
				return (
					<CardRankingTableRow
						key={row.dbf_id}
						card={card}
						customCardText={
							isNoTarget
								? t("No target")
								: isFace
									? t("Opponent hero")
									: undefined
						}
						popularity={popularity}
						rank={
							(this.state.page - 1) * this.props.numRows +
							index +
							1
						}
						winrate={hasWinrate ? +row.win_rate : undefined}
						noLink={isFace || isNoTarget}
					/>
				);
			});

		const tooltip = (key: keyof TooltipMap<any>): React.ReactNode => {
			if (!this.props.tooltips) {
				return null;
			}
			if (!this.props.tooltips[key]) {
				return null;
			}
			return this.props.tooltips[key];
		};

		return (
			<div className="text-center">
				<table className="table table-striped">
					<thead>
						<tr>
							<th className="hidden-xs">
								{t("Rank")}
								{tooltip("rank")}
							</th>
							<th>
								{t("Card")}
								{tooltip("card")}
							</th>
							<th>
								{t("Popularity")}
								{tooltip("popularity")}
							</th>
							{hasWinrate ? (
								<th>
									{t("Winrate")}
									{tooltip("winrate")}
								</th>
							) : null}
						</tr>
					</thead>
					<tbody>{cardRows}</tbody>
				</table>
				<Pager
					currentPage={this.state.page}
					setCurrentPage={(page: number) => this.setState({ page })}
					pageCount={Math.ceil(rowCount / this.props.numRows)}
					minimal
				/>
			</div>
		);
	}
}
export default withTranslation()(CardRankingTable);
