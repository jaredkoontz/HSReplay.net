import React from "react";
import CardTile from "../CardTile";
import Table, { AnnotatedNumber } from "./Table";
import { CardObj, SortableProps } from "../../interfaces";
import { withLoading } from "../loading/Loading";
import {
	cardTableColumnData,
	CardTableColumnKey,
} from "./cardtable/CardTableColumns";
import {
	ApiCardStatsData,
	generateCardTableRowData,
} from "./cardtable/RowDataGenerator";
import { isMissingCardFromCollection } from "../../utils/collection";
import { Collection } from "../../utils/api";

interface Props extends SortableProps {
	baseWinrate?: number;
	cards?: CardObj[];
	columns: CardTableColumnKey[];
	data?: ApiCardStatsData[];
	numCards?: number;
	topInfoRow?: React.ReactNode;
	bottomInfoRow?: React.ReactNode;
	minColumnWidth?: number;
	headerWidth?: [number, number];
	headerWidthRatio?: number;
	collection?: Collection | null;
	showEmptyCollection?: boolean;
	forceCardCounts?: boolean | ((count: number) => boolean);
	alternatingBackground?: string;
}

const CELL_HEIGHT = 36;
const MIN_COLUMN_WIDTH = 150;
const MAX_HEADER_WIDTH = 217;
const MIN_HEADER_WIDTH = 150;

class CardTable extends React.Component<Props> {
	public render(): React.ReactNode {
		const {
			baseWinrate,
			cards,
			data,
			sortBy,
			sortDirection,
			numCards,
			minColumnWidth,
			headerWidth,
		} = this.props;
		const columnKeys = ["card"].concat(this.props.columns);
		const columns = columnKeys.map(key => cardTableColumnData[key]);
		let rowData = generateCardTableRowData(
			cards,
			data,
			sortBy,
			sortDirection,
			columns.slice(1),
		);
		if (numCards !== undefined) {
			rowData = rowData.slice(0, numCards);
		}
		const tableRowData = rowData.map(({ card, values }) => {
			const row: Array<
				number | AnnotatedNumber | JSX.Element
			> = values.slice();

			row.unshift(
				<CardTile
					card={card.card}
					count={card.count}
					height={CELL_HEIGHT - 2}
					forceCountBox={
						typeof this.props.forceCardCounts === "function"
							? this.props.forceCardCounts(card.count)
							: this.props.forceCardCounts
					}
					craftable={
						!this.props.collection
							? this.props.showEmptyCollection
							: isMissingCardFromCollection(
									this.props.collection,
									card.card.dbfId,
									card.count || 1,
							  )
					}
				/>,
			);
			return { key: "" + card.card.dbfId, data: row };
		});
		return (
			<Table
				cellHeight={CELL_HEIGHT}
				minColumnWidth={minColumnWidth || MIN_COLUMN_WIDTH}
				headerWidth={
					headerWidth || [MIN_HEADER_WIDTH, MAX_HEADER_WIDTH]
				}
				baseWinrate={baseWinrate}
				sortBy={sortBy}
				sortDirection={sortDirection}
				onSortChanged={this.props.onSortChanged}
				columns={columns}
				rowData={tableRowData}
				topInfoRow={this.props.topInfoRow}
				bottomInfoRow={this.props.bottomInfoRow}
				headerWidthRatio={this.props.headerWidthRatio}
				alternatingBackground={this.props.alternatingBackground}
			/>
		);
	}
}

export default withLoading()(CardTable);
