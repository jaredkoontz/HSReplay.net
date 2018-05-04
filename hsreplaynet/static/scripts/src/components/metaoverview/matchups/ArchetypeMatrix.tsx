import MatchupCell from "./MatchupCell";
import React from "react";
import SortHeader from "../../SortHeader";
import CardData from "../../../CardData";
import { AutoSizer, Grid, ScrollSync } from "react-virtualized";
import { ArchetypeData, SortDirection } from "../../../interfaces";
import scrollbarSize from "dom-helpers/util/scrollbarSize";
import ColumnHeader from "./ColumnHeader";
import RowHeader from "./RowHeader";
import RowFooter from "./RowFooter";
import ColumnFooter from "./ColumnFooter";
import ArchetypeSearch from "../../ArchetypeSearch";
import InfoIcon from "../../InfoIcon";
import { Archetype } from "../../../utils/api";

interface Props {
	archetypes: ArchetypeData[];
	allArchetypes: Archetype[];
	cardData: CardData;
	customWeights: any;
	onCustomWeightsChanged: (archetypeId: number, popularity: number) => void;
	useCustomWeights: boolean;
	onUseCustomWeightsChanged: (useCustomPopularities: boolean) => void;
	favorites: number[];
	gameType: string;
	ignoredColumns: number[];
	maxPopularity?: number;
	onFavoriteChanged: (archetypeId: number, favorite: boolean) => void;
	onIgnoreChanged: (archetypeId: number | number[], ignore: boolean) => void;
	onSortChanged: (sortBy: string, sortDirection: SortDirection) => void;
	sortBy: string;
	sortDirection: SortDirection;
	simple?: boolean;
}

interface State {
	highlightColumn: number;
	highlightRow: number;
}

const offWhite = "#fbf7f6";
const headerCellWidth = 210;
const headerCellHeight = 132;
const cellWidth = 70;
const cellHeight = 40;
const footerCellHeight = 80;
const spacerSize = 5;

export default class ArchetypeMatrix extends React.Component<Props, State> {
	private rowHeaders: Grid = null;
	private matchupCells: Grid = null;
	private rowFooters: Grid = null;

	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			highlightColumn: null,
			highlightRow: null,
		};
	}

	private renderLeftHeader(): React.ReactNode {
		if (this.props.simple) {
			return null;
		}
		return (
			<div
				className="matchup-header-cell matchup-header-top-left matchup-header-archetype"
				style={{
					height: headerCellHeight,
					width: headerCellWidth,
				}}
			>
				{this.getSortHeader("class", "Archetype", "ascending")}
				<ArchetypeSearch
					availableArchetypes={this.props.allArchetypes
						.slice()
						.sort((a, b) => (a.name > b.name ? 1 : -1))}
					onArchetypeSelected={archetype => {
						this.props.onFavoriteChanged(archetype.id, true);
						this.recomputeGridSize();
					}}
				/>
			</div>
		);
	}

	private renderColumnHeaders(
		archetypes: ArchetypeData[],
		width: number,
		clientWidth: number,
		scrollbarWidth: number,
		scrollWidth: number,
		scrollLeft: number,
		right: number,
	): React.ReactNode {
		return (
			<div
				className="grid-container grid-container-top"
				style={{
					left: headerCellWidth,
					background: "none",
				}}
			>
				<Grid
					cellRenderer={({ columnIndex, key, style }) => {
						const archetype = archetypes[columnIndex];
						const isIgnored =
							this.props.ignoredColumns.indexOf(archetype.id) !==
							-1;

						return (
							<ColumnHeader
								archetypeData={archetype}
								highlight={
									this.state.highlightColumn === columnIndex
								}
								isIgnored={!this.props.simple && isIgnored}
								onIgnoredChanged={(
									ignore: boolean,
									ignoreClass?: boolean,
								) => {
									if (ignoreClass) {
										const archetypeIds = this.props.allArchetypes
											.filter(a => {
												return (
													a.player_class_name ===
													archetype.playerClass
												);
											})
											.map(x => x.id);
										this.props.onIgnoreChanged(
											archetypeIds,
											ignore,
										);
									} else {
										this.props.onIgnoreChanged(
											archetype.id,
											ignore,
										);
									}
								}}
								key={key}
								style={style}
							/>
						);
					}}
					width={
						width -
						headerCellWidth -
						this.rowFooterWidth() -
						scrollbarWidth
					}
					height={headerCellHeight}
					columnCount={archetypes.length}
					columnWidth={cellWidth}
					rowCount={1}
					rowHeight={headerCellHeight}
					scrollLeft={scrollLeft}
					className={"matchup-header"}
				/>
				<div
					className={
						"gradient gradient-left gradient-fade" +
						(scrollLeft <= 0 ? " gradient-hidden" : "")
					}
				/>
				<div
					className={
						"gradient gradient-right gradient-fade" +
						(scrollbarWidth + clientWidth + scrollLeft >=
							scrollWidth || right > 0
							? " gradient-hidden"
							: "")
					}
				/>
			</div>
		);
	}

	private renderEwrHeader(right: number): React.ReactNode {
		if (this.props.simple) {
			return null;
		}
		return (
			<div
				className="matchup-header-cell matchup-header-top-right"
				style={{
					height: headerCellHeight,
					width: cellWidth,
					right,
				}}
			>
				{this.getSortHeader(
					"winrate",
					"EWR",
					null,
					"Effective Winrate",
					"The expected winrate against all active archetypes, weighted by their popularity.",
				)}
			</div>
		);
	}

	private renderRowHeaders(
		archetypes: ArchetypeData[],
		height: number,
		clientHeight: number,
		scrollbarHeight: number,
		scrollHeight: number,
		scrollTop: number,
		bottom: number,
	): React.ReactNode {
		return (
			<div
				className="grid-container grid-container-left"
				style={{ top: headerCellHeight }}
			>
				<Grid
					cellRenderer={({ key, rowIndex, style }) => {
						const archetype = archetypes[rowIndex];
						const isFavorite =
							this.props.favorites.indexOf(archetype.id) !== -1;

						if (this.isLastFavorite(rowIndex)) {
							style["border-bottom"] =
								spacerSize + "px solid " + offWhite;
						}

						return (
							<RowHeader
								archetypeData={archetype}
								highlight={this.state.highlightRow === rowIndex}
								isFavorite={isFavorite}
								onFavoriteChanged={(favorite: boolean) => {
									this.props.onFavoriteChanged(
										archetype.id,
										favorite,
									);
									this.recomputeGridSize();
								}}
								cardData={this.props.cardData}
								key={key}
								style={style}
								gameType={this.props.gameType}
							/>
						);
					}}
					width={headerCellWidth}
					height={
						height -
						headerCellHeight -
						this.columnFooterHeight() -
						scrollbarHeight
					}
					columnCount={1}
					columnWidth={headerCellWidth}
					rowCount={archetypes.length}
					rowHeight={({ index }) =>
						cellHeight +
						(this.isLastFavorite(index) ? spacerSize : 0)
					}
					scrollTop={scrollTop}
					className={"matchup-header"}
					ref={ref => (this.rowHeaders = ref)}
				/>
				<div
					className={
						"gradient gradient-top" +
						(scrollTop <= 0 ? " gradient-hidden" : "")
					}
				/>
				<div
					className={
						"gradient gradient-bottom" +
						(scrollbarHeight + clientHeight + scrollTop >=
							scrollHeight || bottom > 0
							? " gradient-hidden"
							: "")
					}
				/>
			</div>
		);
	}

	private renderMatchupCells(
		archetypes: ArchetypeData[],
		width: number,
		clientWidth: number,
		scrollbarWidth: number,
		scrollWidth: number,
		scrollLeft: number,
		right: number,
		height: number,
		clientHeight: number,
		scrollbarHeight: number,
		scrollHeight: number,
		scrollTop: number,
		bottom: number,
		onScroll: any,
	): React.ReactNode {
		return (
			<div
				className="grid-container"
				style={{
					top: headerCellHeight,
					left: headerCellWidth,
				}}
			>
				<Grid
					cellRenderer={({ columnIndex, key, rowIndex, style }) => {
						const archetype = archetypes[rowIndex];
						const matchup = archetype.matchups[columnIndex];
						const isIgnored =
							this.props.ignoredColumns.indexOf(
								matchup.opponentId,
							) !== -1;
						const hasNoCustomData =
							this.props.useCustomWeights &&
							!this.props.customWeights[matchup.opponentId];

						if (this.isLastFavorite(rowIndex)) {
							style["border-bottom"] =
								spacerSize + "px solid " + offWhite;
						}

						return (
							<MatchupCell
								key={key}
								style={style}
								matchupData={matchup}
								isIgnored={isIgnored || hasNoCustomData}
								highlightColumn={
									this.state.highlightColumn === columnIndex
								}
								highlightRow={
									this.state.highlightRow === rowIndex
								}
							/>
						);
					}}
					scrollToAlignment="start"
					scrollToColumn={0}
					scrollToRow={0}
					width={Math.min(
						cellWidth * archetypes.length + scrollbarWidth,
						width - headerCellWidth - this.rowFooterWidth(),
					)}
					height={Math.min(
						cellHeight * archetypes.length + scrollbarHeight,
						height - headerCellHeight - this.columnFooterHeight(),
					)}
					columnCount={archetypes.length}
					columnWidth={cellWidth}
					rowCount={archetypes.length}
					rowHeight={({ index }) =>
						cellHeight +
						(this.isLastFavorite(index) ? spacerSize : 0)
					}
					scrollTop={scrollTop}
					onScroll={onScroll}
					className={"matchup-matrix"}
					ref={ref => (this.matchupCells = ref)}
				/>
				<div
					className={
						"gradient gradient-top" +
						(scrollTop <= 0 ? " gradient-hidden" : "")
					}
				/>
				<div
					className={
						"gradient gradient-bottom" +
						(scrollbarHeight + clientHeight + scrollTop >=
							scrollHeight || bottom > 0
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
						(scrollLeft <= 0 ? " gradient-hidden" : "")
					}
				/>
				<div
					className={
						"gradient gradient-right" +
						(scrollbarWidth + clientWidth + scrollLeft >=
							scrollWidth || right > 0
							? " gradient-hidden"
							: "")
					}
					style={{
						right: scrollbarWidth,
					}}
				/>
			</div>
		);
	}

	private renderLeftFooter(bottom: number): React.ReactNode {
		if (this.props.simple) {
			return null;
		}
		return (
			<div
				className="matchup-header-cell matchup-header-bottom-left matchup-header-popularity"
				style={{
					height: footerCellHeight,
					width: headerCellWidth,
					bottom,
				}}
			>
				{this.getSortHeader(
					"popularity",
					"Popularity",
					null,
					"Popularity on Ladder",
					"The percentage of decks played that belong to this archetype.",
				)}
				<label className="custom-weight-checkbox">
					<input
						type="checkbox"
						onChange={() =>
							this.props.onUseCustomWeightsChanged(
								!this.props.useCustomWeights,
							)
						}
						checked={this.props.useCustomWeights}
					/>
					&nbsp;Custom&nbsp;weights&nbsp;
					<InfoIcon
						header="Custom weights"
						content="Check this box to provide your own popularity weights, e.g. based on tournament popularity data you may have."
					/>
				</label>
			</div>
		);
	}

	private renderColumnFooter(
		archetypes: ArchetypeData[],
		width: number,
		clientWidth: number,
		scrollbarWidth: number,
		scrollWidth: number,
		scrollLeft: number,
		right: number,
		bottom: number,
	): React.ReactNode {
		if (this.props.simple) {
			return null;
		}
		return (
			<div
				className="grid-container grid-container-bottom"
				style={{
					left: headerCellWidth,
					bottom,
				}}
			>
				<Grid
					cellRenderer={({ columnIndex, key, style }) => {
						const archetype = archetypes[columnIndex];
						return (
							<ColumnFooter
								archetypeData={archetype}
								highlight={
									this.state.highlightColumn === columnIndex
								}
								max={this.props.maxPopularity}
								style={style}
								customWeight={
									this.props.customWeights[archetype.id] || 0
								}
								useCustomWeight={this.props.useCustomWeights}
								onCustomWeightChanged={(popularity: number) => {
									this.props.onCustomWeightsChanged(
										archetype.id,
										popularity,
									);
								}}
							/>
						);
					}}
					width={
						width -
						headerCellWidth -
						this.rowFooterWidth() -
						scrollbarWidth
					}
					height={footerCellHeight}
					columnCount={archetypes.length}
					columnWidth={cellWidth}
					rowCount={1}
					rowHeight={footerCellHeight}
					scrollLeft={scrollLeft}
					className={"matchup-header"}
				/>
				<div
					className={
						"gradient gradient-left" +
						(scrollLeft <= 0 ? " gradient-hidden" : "")
					}
				/>
				<div
					className={
						"gradient gradient-right" +
						(scrollbarWidth + clientWidth + scrollLeft >=
							scrollWidth || right > 0
							? " gradient-hidden"
							: "")
					}
				/>
			</div>
		);
	}

	private renderEwrCell(
		archetypes: ArchetypeData[],
		right: number,
		height: number,
		clientHeight: number,
		scrollbarHeight: number,
		scrollHeight: number,
		scrollTop: number,
		bottom: number,
	): React.ReactNode {
		if (this.props.simple) {
			return null;
		}
		return (
			<div
				className="grid-container grid-container-right"
				style={{
					top: headerCellHeight,
					right,
				}}
			>
				<Grid
					cellRenderer={({ key, rowIndex, style }) => {
						if (this.isLastFavorite(rowIndex)) {
							style["border-bottom"] =
								spacerSize + "px solid " + offWhite;
						}
						return (
							<RowFooter
								archetypeData={archetypes[rowIndex]}
								highlight={this.state.highlightRow === rowIndex}
								key={key}
								style={style}
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
					rowHeight={({ index }) =>
						cellHeight +
						(this.isLastFavorite(index) ? spacerSize : 0)
					}
					scrollTop={scrollTop}
					className={"matchup-header"}
					ref={ref => (this.rowFooters = ref)}
				/>
				<div
					className={
						"gradient gradient-top" +
						(scrollTop <= 0 ? " gradient-hidden" : "")
					}
				/>
				<div
					className={
						"gradient gradient-bottom" +
						(scrollbarHeight + clientHeight + scrollTop >=
							scrollHeight || bottom > 0
							? " gradient-hidden"
							: "")
					}
				/>
			</div>
		);
	}

	private rowFooterWidth(): number {
		return this.props.simple ? 0 : cellWidth;
	}

	private columnFooterHeight(): number {
		return this.props.simple ? 0 : footerCellHeight;
	}

	public render(): React.ReactNode {
		const archetypes = this.props.archetypes.slice(
			0,
			this.props.simple && 4,
		);

		const gridWidth = cellWidth * archetypes.length;
		const gridHeight = cellHeight * archetypes.length;

		const totalHeight =
			gridHeight + headerCellHeight + this.columnFooterHeight();

		const totalWidth = gridWidth + headerCellWidth + this.rowFooterWidth();

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
										{this.renderLeftHeader()}
										{this.renderColumnHeaders(
											archetypes,
											width,
											clientWidth,
											scrollbarWidth,
											scrollWidth,
											scrollLeft,
											right,
										)}
										{this.renderEwrHeader(right)}
										{this.renderRowHeaders(
											archetypes,
											height,
											clientHeight,
											scrollbarHeight,
											scrollHeight,
											scrollTop,
											bottom,
										)}
										{this.renderMatchupCells(
											archetypes,
											width,
											clientWidth,
											scrollbarWidth,
											scrollWidth,
											scrollLeft,
											right,
											height,
											clientHeight,
											scrollbarHeight,
											scrollHeight,
											scrollTop,
											bottom,
											onScroll,
										)}
										{this.renderLeftFooter(bottom)}
										{this.renderColumnFooter(
											archetypes,
											width,
											clientWidth,
											scrollbarWidth,
											scrollWidth,
											scrollLeft,
											right,
											bottom,
										)}
										{this.renderEwrCell(
											archetypes,
											right,
											height,
											clientHeight,
											scrollbarHeight,
											scrollHeight,
											scrollTop,
											bottom,
										)}
									</div>
								)}
							</ScrollSync>
						);
					}}
				</AutoSizer>
			</div>
		);
	}

	recomputeGridSize() {
		this.rowHeaders && this.rowHeaders.recomputeGridSize();
		this.matchupCells && this.matchupCells.recomputeGridSize();
		this.rowFooters && this.rowFooters.recomputeGridSize();
	}

	isLastFavorite(index: number) {
		return index === this.props.favorites.length - 1;
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
