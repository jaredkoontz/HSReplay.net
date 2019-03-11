import scrollbarSize from "dom-helpers/util/scrollbarSize";
import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import { AutoSizer, Grid, ScrollSync } from "react-virtualized";
import CardData from "../../../CardData";
import { ArchetypeRankPopularity, SortDirection } from "../../../interfaces";
import SortHeader from "../../SortHeader";
import ColumnFooter from "./ColumnFooter";
import ColumnHeader from "./ColumnHeader";
import PopularityCell from "./PopularityCell";
import RowHeader from "./RowHeader";

interface Props extends WithTranslation {
	archetypes: ArchetypeRankPopularity[];
	cardData: CardData;
	games: number[];
	gameType: string;
	maxGames: number;
	maxPopuarity: number;
	onSortChanged: (sortBy: string, sortDirection: SortDirection) => void;
	sortBy: string;
	sortDirection: SortDirection;
	numRanks: number;
}

class PopularityMatrix extends React.Component<Props> {
	public render(): React.ReactNode {
		const { archetypes, numRanks, t } = this.props;

		const headerCellWidth = 210;
		const headerCellHeight = 132;
		const cellWidth = 70;
		const cellHeight = 40;
		const footerCellHeight = cellHeight;

		const gridWidth = cellWidth * numRanks;
		const gridHeight = cellHeight * archetypes.length;

		const totalHeight = gridHeight + headerCellHeight + footerCellHeight;
		const totalWidth = gridWidth + headerCellWidth + cellWidth;

		return (
			<div className="archetype-matrix-container">
				<AutoSizer>
					{({ height, width }) => {
						const scrollbarWidth =
							totalHeight > height ? scrollbarSize() : 0;
						const scrollbarHeight =
							totalWidth > width ? scrollbarSize() : 0;
						const right = Math.max(
							0,
							width - totalWidth - scrollbarWidth,
						);
						const bottom = Math.max(
							0,
							height - totalHeight - scrollbarHeight,
						);
						return (
							<ScrollSync>
								{({
									clientHeight,
									clientWidth,
									onScroll,
									scrollHeight,
									scrollLeft,
									scrollTop,
									scrollWidth,
								}) => (
									<div className="matchup-matrix">
										<div
											className="matchup-header-cell matchup-header-top-left"
											style={{
												height: headerCellHeight,
												width: headerCellWidth,
											}}
										>
											{this.getSortHeader(
												"class",
												t("Archetype"),
												"ascending",
											)}
										</div>
										<div
											className="grid-container grid-container-top"
											style={{ left: headerCellWidth }}
										>
											<Grid
												cellRenderer={({
													columnIndex,
													key,
													style,
												}) => {
													const archetype =
														archetypes[0];
													const rankData =
														archetype.rankData[
															columnIndex
														];

													return (
														<ColumnHeader
															rankData={rankData}
															key={key}
															style={style}
															active={
																this.props
																	.sortBy ===
																"rank" +
																	rankData.rank
															}
															direction={
																this.props
																	.sortDirection
															}
															sortKey={
																"rank" +
																rankData.rank
															}
															onClick={
																this.props
																	.onSortChanged
															}
														/>
													);
												}}
												width={
													width -
													headerCellWidth -
													cellWidth -
													scrollbarWidth
												}
												height={headerCellHeight}
												columnCount={numRanks}
												columnWidth={cellWidth}
												rowCount={1}
												rowHeight={headerCellHeight}
												scrollLeft={scrollLeft}
												className={"matchup-header"}
											/>
											<div
												className={
													"gradient gradient-left gradient-fade" +
													(scrollLeft <= 0
														? " gradient-hidden"
														: "")
												}
											/>
											<div
												className={
													"gradient gradient-right gradient-fade" +
													(scrollbarWidth +
														clientWidth +
														scrollLeft >=
														scrollWidth || right > 0
														? " gradient-hidden"
														: "")
												}
											/>
										</div>
										<div
											className="matchup-header-cell matchup-header-top-right"
											style={{
												height: headerCellHeight,
												width: cellWidth,
												right,
											}}
										>
											{this.getSortHeader(
												"total",
												t("Total"),
												null,
											)}
										</div>
										<div
											className="grid-container grid-container-left"
											style={{ top: headerCellHeight }}
										>
											<Grid
												cellRenderer={({
													key,
													rowIndex,
													style,
												}) => {
													const archetype =
														archetypes[rowIndex];
													return (
														<RowHeader
															archetypeData={
																archetype
															}
															cardData={
																this.props
																	.cardData
															}
															gameType={
																this.props
																	.gameType
															}
															key={key}
															style={style}
														/>
													);
												}}
												width={headerCellWidth}
												height={
													height -
													headerCellHeight -
													footerCellHeight -
													scrollbarHeight
												}
												columnCount={1}
												columnWidth={headerCellWidth}
												rowCount={archetypes.length}
												rowHeight={cellHeight}
												scrollTop={scrollTop}
												className={"matchup-header"}
											/>
											<div
												className={
													"gradient gradient-top" +
													(scrollTop <= 0
														? " gradient-hidden"
														: "")
												}
											/>
											<div
												className={
													"gradient gradient-bottom" +
													(scrollbarHeight +
														clientHeight +
														scrollTop >=
														scrollHeight ||
													bottom > 0
														? " gradient-hidden"
														: "")
												}
											/>
										</div>
										<div
											className="grid-container"
											style={{
												top: headerCellHeight,
												left: headerCellWidth,
											}}
										>
											<Grid
												cellRenderer={({
													columnIndex,
													key,
													rowIndex,
													style,
												}) => {
													const archetype =
														archetypes[rowIndex];
													const rankData =
														archetype.rankData[
															columnIndex
														];
													return (
														<PopularityCell
															key={key}
															style={style}
															popularity={
																rankData.popularityAtRank
															}
															maxPopularity={
																this.props
																	.maxPopuarity
															}
														/>
													);
												}}
												scrollToAlignment="start"
												scrollToColumn={0}
												scrollToRow={0}
												width={Math.min(
													cellWidth * numRanks +
														scrollbarWidth,
													width -
														headerCellWidth -
														cellWidth,
												)}
												height={Math.min(
													cellHeight *
														archetypes.length +
														scrollbarHeight,
													height -
														headerCellHeight -
														footerCellHeight,
												)}
												columnCount={numRanks}
												columnWidth={cellWidth}
												rowCount={archetypes.length}
												rowHeight={cellHeight}
												scrollTop={scrollTop}
												onScroll={onScroll}
												className={"matchup-matrix"}
											/>
											<div
												className={
													"gradient gradient-top" +
													(scrollTop <= 0
														? " gradient-hidden"
														: "")
												}
											/>
											<div
												className={
													"gradient gradient-bottom" +
													(scrollbarHeight +
														clientHeight +
														scrollTop >=
														scrollHeight ||
													bottom > 0
														? " gradient-hidden"
														: "")
												}
												style={{
													bottom: scrollbarHeight,
												}}
											/>
											<div
												className={
													"gradient gradient-left" +
													(scrollLeft <= 0
														? " gradient-hidden"
														: "")
												}
											/>
											<div
												className={
													"gradient gradient-right" +
													(scrollbarWidth +
														clientWidth +
														scrollLeft >=
														scrollWidth || right > 0
														? " gradient-hidden"
														: "")
												}
												style={{
													right: scrollbarWidth,
												}}
											/>
										</div>
										<div
											className="grid-container grid-container-right"
											style={{
												top: headerCellHeight,
												right,
											}}
										>
											<Grid
												cellRenderer={({
													key,
													rowIndex,
													style,
												}) => {
													return (
														<PopularityCell
															key={key}
															style={style}
															popularity={
																archetypes[
																	rowIndex
																]
																	.totalPopularity
															}
															maxPopularity={
																this.props
																	.maxPopuarity
															}
														/>
													);
												}}
												width={cellWidth}
												height={
													height -
													headerCellHeight -
													footerCellHeight -
													scrollbarHeight
												}
												columnCount={1}
												columnWidth={cellWidth}
												rowCount={archetypes.length}
												rowHeight={cellHeight}
												scrollTop={scrollTop}
												className={"matchup-header"}
											/>
											<div
												className={
													"gradient gradient-top" +
													(scrollTop <= 0
														? " gradient-hidden"
														: "")
												}
											/>
											<div
												className={
													"gradient gradient-bottom" +
													(scrollbarHeight +
														clientHeight +
														scrollTop >=
														scrollHeight ||
													bottom > 0
														? " gradient-hidden"
														: "")
												}
											/>
										</div>
										<div
											className="matchup-header-cell matchup-header-bottom-left"
											style={{
												height: footerCellHeight,
												width: headerCellWidth,
												bottom,
											}}
										>
											<div>{t("Games")}</div>
										</div>
										<div
											className="grid-container grid-container-bottom"
											style={{
												left: headerCellWidth,
												bottom,
											}}
										>
											<Grid
												cellRenderer={({
													columnIndex,
													key,
													style,
												}) => (
													<ColumnFooter
														games={
															this.props.games[
																columnIndex
															]
														}
														maxGames={
															this.props.maxGames
														}
														style={style}
													/>
												)}
												width={
													width -
													headerCellWidth -
													cellWidth -
													scrollbarWidth
												}
												height={footerCellHeight}
												columnCount={numRanks}
												columnWidth={cellWidth}
												rowCount={1}
												rowHeight={footerCellHeight}
												scrollLeft={scrollLeft}
												className={"matchup-header"}
											/>
											<div
												className={
													"gradient gradient-left" +
													(scrollLeft <= 0
														? " gradient-hidden"
														: "")
												}
											/>
											<div
												className={
													"gradient gradient-right" +
													(scrollbarWidth +
														clientWidth +
														scrollLeft >=
														scrollWidth || right > 0
														? " gradient-hidden"
														: "")
												}
											/>
										</div>
									</div>
								)}
							</ScrollSync>
						);
					}}
				</AutoSizer>
			</div>
		);
	}

	getSortHeader(
		key: string,
		text: string,
		direction?: SortDirection,
		infoHeader?: string,
		infoText?: string,
	): React.ReactNode {
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

export default withTranslation()(PopularityMatrix);
