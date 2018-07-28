import React from "react";
import _ from "lodash";
import { AutoSizer, Grid, ScrollSync } from "react-virtualized";
import { SortableProps, SortDirection } from "../../interfaces";
import scrollbarSize from "dom-helpers/util/scrollbarSize";
import SortHeader from "../SortHeader";
import {
	sliceZeros,
	toDynamicFixed,
	toPrettyNumber,
	winrateData,
} from "../../helpers";
import Tooltip from "../Tooltip";

export interface TableColumn {
	dataKey: string;
	defaultSortDirection?: SortDirection;
	infoHeader?: string;
	infoText?: string;
	percent?: boolean;
	prettify?: boolean;
	lowDataKey?: string;
	lowDataValue?: number;
	lowDataWarning?: string;
	sortKey?: string;
	text: string;
	winrateData?: boolean;
}

interface Annotation {
	type: "warning";
	tooltip: string;
}

export interface AnnotatedNumber {
	value: number;
	annotation: Annotation;
}

interface InternalRowData {
	type: "data" | "ad";
	data: RowData | React.ReactNode;
}

interface RowData {
	key?: string;
	data: Array<number | AnnotatedNumber | string | React.ReactNode>;
	href?: string;
}

export interface BaseTableProps extends SortableProps {
	baseWinrate?: number;
	columns: TableColumn[];
	rowData: RowData[];
	topInfoRow?: React.ReactNode;
	bottomInfoRow?: React.ReactNode;
	headerWidthRatio?: number;
}

interface Props extends BaseTableProps {
	cellHeight: number;
	minColumnWidth: number;
	headerWidth: [number, number];
	rowHighlighting?: boolean;
	alternatingBackground?: string;
	adInterval?: number;
	ads?: React.ReactNode[];
}

interface State {
	hoveringRow: number;
	referenceId: string;
	rowData: InternalRowData[];
}

const HEADER_WIDTH_RATIO = 0.33;
const INFO_ROW_HEIGHT = 50;
const AD_HEIGHT = 120;

export default class Table extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			hoveringRow: -1,
			referenceId: _.uniqueId("table"),
			rowData: this.getRowData(props),
		};
	}

	componentWillReceiveProps(nextProps: Props) {
		this.setState({ rowData: this.getRowData(nextProps) });
	}

	private getRowData(props: Props): InternalRowData[] {
		const data: InternalRowData[] = [];
		props.rowData.forEach((row, index) => {
			if (this.props.ads && index > 0 && index % props.adInterval === 0) {
				const adIndex = Math.floor(index / props.adInterval) - 1;
				if (adIndex < this.props.ads.length) {
					data.push({ type: "ad", data: props.ads[adIndex] });
				}
			}
			data.push({ type: "data", data: row });
		});
		return data;
	}

	public render(): React.ReactNode {
		const {
			cellHeight,
			columns,
			minColumnWidth,
			topInfoRow,
			bottomInfoRow,
		} = this.props;
		const [minHeaderWidth, maxHeaderWidth] = this.props.headerWidth;
		const numColumns = this.props.columns.length - 1;
		const topOffset = topInfoRow ? INFO_ROW_HEIGHT : 0;
		const bottomOffset = bottomInfoRow ? INFO_ROW_HEIGHT : 0;

		const numDataRows = this.props.rowData.length;
		const adRows = this.state.rowData.filter(x => x.type === "ad");
		const numRows = numDataRows + adRows.length;

		const adHeight = AD_HEIGHT;

		const totalHeight =
			cellHeight * (numDataRows + 1) +
			scrollbarSize() +
			topOffset +
			bottomOffset +
			adRows.filter(x => x.data).length * adHeight;

		return (
			<div className="table-container" style={{ height: totalHeight }}>
				<AutoSizer>
					{({ width }) => {
						const headerWidthRatio =
							this.props.headerWidthRatio || HEADER_WIDTH_RATIO;
						const headerWidth = Math.max(
							minHeaderWidth,
							Math.min(maxHeaderWidth, width * headerWidthRatio),
						);
						const requiredWith =
							headerWidth + minColumnWidth * numColumns;
						let columnWidth = minColumnWidth;
						if (requiredWith < width) {
							columnWidth = Math.max(
								minColumnWidth,
								(width - headerWidth) / numColumns,
							);
						}
						return (
							<ScrollSync>
								{({ onScroll, scrollLeft }) => (
									<>
										<div className="grid-container grid-container-top grid-container-left">
											<div
												className="table-column-header"
												style={{
													lineHeight:
														cellHeight - 1 + "px",
													textAlign: "center",
													width: headerWidth,
												}}
											>
												{this.getSortHeader(
													columns[0].sortKey,
													columns[0].text,
													columns[0]
														.defaultSortDirection ||
														"descending",
													columns[0].infoHeader,
													columns[0].infoText,
												)}
											</div>
										</div>
										{this.renderRowHighlighter(
											width,
											cellHeight,
											topOffset,
										)}
										{this.renderInfoRow(
											topInfoRow,
											width,
											cellHeight,
										)}
										{this.renderInfoRow(
											bottomInfoRow,
											width,
											totalHeight -
												INFO_ROW_HEIGHT -
												scrollbarSize(),
										)}
										{this.renderAdRows(
											width,
											cellHeight,
											cellHeight,
											adHeight,
										)}
										<div
											className="grid-container grid-container-top"
											style={{ left: headerWidth }}
										>
											<Grid
												cellRenderer={
													this.columnHeaderRenderer
												}
												columnCount={numColumns}
												columnWidth={columnWidth}
												height={cellHeight}
												rowCount={1}
												rowHeight={cellHeight}
												width={width - headerWidth}
												scrollLeft={scrollLeft}
												className="table-grid table-header"
												style={{}}
											/>
										</div>
										<div
											className="grid-container grid-container-left"
											style={{
												top: cellHeight + topOffset,
											}}
										>
											<Grid
												cellRenderer={
													this.rowHeaderRenderer
												}
												width={headerWidth}
												height={
													totalHeight -
													cellHeight -
													topOffset
												}
												columnCount={1}
												columnWidth={headerWidth}
												rowCount={numRows}
												rowHeight={row =>
													this.getRowHeight(
														row,
														cellHeight,
														adHeight,
													)
												}
												className="table-grid"
												style={{}}
											/>
										</div>
										<div
											className="grid-container"
											style={{
												top: cellHeight + topOffset,
												left: headerWidth,
											}}
										>
											<Grid
												cellRenderer={
													this.columnCellRenderer
												}
												columnCount={numColumns}
												columnWidth={columnWidth}
												height={
													totalHeight -
													cellHeight -
													topOffset
												}
												rowCount={numRows}
												rowHeight={row =>
													this.getRowHeight(
														row,
														cellHeight,
														adHeight,
													)
												}
												width={width - headerWidth}
												onScroll={onScroll}
												scrollLeft={scrollLeft}
												className="table-grid"
												style={{}}
											/>
										</div>
									</>
								)}
							</ScrollSync>
						);
					}}
				</AutoSizer>
			</div>
		);
	}

	private getRowHeight(
		row: any,
		cellHeight: number,
		adHeight: number,
	): number {
		const rowData = this.state.rowData[row.index];
		return rowData && rowData.data
			? rowData.type === "ad"
				? adHeight
				: cellHeight
			: 0;
	}

	private renderAdRows(
		width: number,
		cellHeight: number,
		headerHeight: number,
		adHeight: number,
	) {
		const ads = this.state.rowData.filter(x => x.type === "ad");
		return ads.map((ad, adIndex) => {
			if (!ad.data) {
				return null;
			}
			const offset = _.range(0, adIndex)
				.map(index => {
					return ads[index].data ? adHeight : 0;
				})
				.reduce((a, b) => a + b, 0);
			return (
				<div
					key={`ad-${adIndex}`}
					className="grid-container grid-container-ad"
					style={{
						width,
						top:
							headerHeight +
							(adIndex + 1) * this.props.adInterval * cellHeight +
							offset,
						zIndex: 1,
					}}
				>
					{ad.data}
				</div>
			);
		});
	}

	renderRowHighlighter(
		width: number,
		cellHeight: number,
		topOffset: number,
	): JSX.Element {
		if (this.state.hoveringRow === -1) {
			return null;
		}
		return (
			<div
				className="grid-container grid-container-left table-row-highlighter"
				style={{
					height: cellHeight,
					top: (this.state.hoveringRow + 1) * cellHeight + topOffset,
					width,
				}}
			/>
		);
	}

	renderInfoRow(
		infoRow: React.ReactNode,
		width: number,
		top: number,
	): JSX.Element {
		if (!infoRow) {
			return null;
		}
		return (
			<div
				className="grid-container grid-container-left"
				style={{ top, width: width + "px", zIndex: 1 }}
			>
				{infoRow}
			</div>
		);
	}

	rowHeaderRenderer = ({ rowIndex, key, style }) => {
		style = Object.assign({}, style);
		if (rowIndex % 2 === 0) {
			style["background"] = this.props.alternatingBackground || "white";
		}
		const rowData = this.state.rowData[rowIndex];
		if (!rowData || rowData.type === "ad") {
			return null;
		}
		const row = rowData.data as RowData;
		const props = {
			id: this.getRowId(rowIndex),
			className: "table-row-header",
			key: row.key || key,
			style,
			role: "rowheader",
			...this.rowHighlighting(rowIndex),
		};
		if (row.href) {
			return (
				<a {...props} href={row.href}>
					{row.data[0]}
				</a>
			);
		}
		return <div {...props}>{row.data[0]}</div>;
	};

	columnHeaderRenderer = ({ columnIndex, key, style }) => {
		const column = this.props.columns[columnIndex + 1];
		const content = this.getSortHeader(
			column.sortKey,
			column.text,
			column.defaultSortDirection || "descending",
			column.infoHeader,
			column.infoText,
		);
		style = Object.assign({}, style, {
			lineHeight: `${this.props.cellHeight}px`,
		});
		return (
			<div
				id={this.getColumnId(columnIndex)}
				className="table-column-header"
				style={style}
				key={key}
				role="gridcell"
			>
				{content}
			</div>
		);
	};

	columnCellRenderer = ({ columnIndex, rowIndex, key, style }) => {
		const column = this.props.columns[columnIndex + 1];
		const rowData = this.state.rowData;
		if (!rowData[rowIndex] || rowData[rowIndex].type === "ad") {
			return null;
		}
		const row = rowData[rowIndex].data as RowData;
		let content = row.data[columnIndex + 1];
		if (content === null || content === undefined) {
			content = column.winrateData ? "-" : 0;
		}

		const annotatedNumber = content as AnnotatedNumber;
		if (annotatedNumber && annotatedNumber.annotation) {
			content = annotatedNumber.value;
		}

		let color = null;
		if (content !== "-") {
			if (column.winrateData) {
				const wrdata = winrateData(
					this.props.baseWinrate || 50,
					+content,
					5,
				);
				color = wrdata.color;
				const showTendency =
					this.props.baseWinrate || this.props.baseWinrate === 0;
				content =
					(showTendency ? wrdata.tendencyStr : "") +
					toDynamicFixed(+content) +
					"%";
			} else if (column.percent) {
				content = toDynamicFixed(+content) + "%";
			} else if (column.prettify) {
				content = toPrettyNumber(+content);
			} else {
				content = sliceZeros(toDynamicFixed(+content));
			}
		}

		let background = null;
		if (rowIndex % 2 === 0) {
			background = this.props.alternatingBackground || "white";
		}

		style = Object.assign({}, style, {
			color,
			lineHeight: `${this.props.cellHeight}px`,
			background,
		});

		if (
			rowIndex > 0 &&
			rowData[rowIndex - 1].type === "ad" &&
			rowData[rowIndex - 1].data
		) {
			style["borderTop"] = "1px solid lightgray";
		}

		const props = {
			className: "table-cell",
			key: `${row.key || key}-${column.dataKey}`,
			style,
			role: "gridcell",
			"aria-describedby": `${this.getRowId(rowIndex)} ${this.getColumnId(
				columnIndex,
			)}`,
			...this.rowHighlighting(rowIndex),
		};

		let annotation = null;
		if (annotatedNumber && annotatedNumber.annotation) {
			if (annotatedNumber.annotation.type === "warning") {
				annotation = (
					<span className="glyphicon glyphicon-warning-sign" />
				);
			}
			if (annotatedNumber.annotation.tooltip) {
				annotation = (
					<Tooltip simple header={annotatedNumber.annotation.tooltip}>
						{annotation}
					</Tooltip>
				);
			}
			annotation = (
				<div className="table-cell-annotation">{annotation}</div>
			);
		}

		if (row.href) {
			return (
				<a {...props} href={row.href}>
					{content}
					{annotation}
				</a>
			);
		}

		return (
			<div {...props}>
				{content}
				{annotation}
			</div>
		);
	};

	rowHighlighting(rowIndex: number): { onMouseEnter; onMouseLeave } {
		if (!this.props.rowHighlighting) {
			return null;
		}
		return {
			onMouseEnter: () => this.setState({ hoveringRow: rowIndex }),
			onMouseLeave: () => this.setState({ hoveringRow: -1 }),
		};
	}

	getRowId(rowIndex: number | string): string {
		return `${this.state.referenceId}-row${rowIndex}`;
	}

	getColumnId(rowIndex: number | string): string {
		return `${this.state.referenceId}-column${rowIndex}`;
	}

	getSortHeader(
		key: string,
		text: string,
		direction?: SortDirection,
		infoHeader?: string,
		infoText?: string,
	): JSX.Element {
		return (
			<SortHeader
				active={this.props.sortBy === key}
				defaultSortDirection={direction || "descending"}
				direction={this.props.sortDirection}
				sortKey={key}
				text={text}
				onClick={this.props.onSortChanged}
				classNames={["text-center"]}
				infoHeader={infoHeader}
				infoText={infoText}
				element={<div />}
			/>
		);
	}
}
