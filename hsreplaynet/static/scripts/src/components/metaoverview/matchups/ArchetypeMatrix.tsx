import scrollbarSize from "dom-helpers/util/scrollbarSize";
import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import { AutoSizer, Grid, ScrollSync } from "react-virtualized";
import CardData from "../../../CardData";
import { ArchetypeData, SortDirection } from "../../../interfaces";
import { Archetype } from "../../../utils/api";
import ArchetypeSearch from "../../ArchetypeSearch";
import InfoIcon from "../../InfoIcon";
import SortHeader from "../../SortHeader";
import ColumnFooter from "./ColumnFooter";
import ColumnHeader from "./ColumnHeader";
import MatchupCell, { CellColorStyle } from "./MatchupCell";
import RowFooter from "./RowFooter";
import RowHeader from "./RowHeader";

interface Props extends InjectedTranslateProps {
	friendlyArchetypes: number[];
	opposingArchetypes: number[];
	archetypeMatchups: ArchetypeData[];
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
	minGames?: number;
	maxArchetypes?: number;
	ignoreMirror?: boolean;
	columnHeaderLinks?: boolean;
	cellWidth?: number;
	cellHeight?: number;
	cellColorStyle?: CellColorStyle;
	vodsIndexData?: any;
}

interface State {
	highlightColumn: number;
	highlightRow: number;
}

const offWhite = "#fbf7f6";
const defaultCellWidth = 70;
const defaultCellHeight = 40;
const footerCellHeight = 80;
const spacerSize = 5;

class ArchetypeMatrix extends React.Component<Props, State> {
	private rowHeaders: Grid = null;
	private matchupCells: Grid = null;
	private rowFooters: Grid = null;
	private headerCellWidth = 210;
	private headerCellHeight = 132;

	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			highlightColumn: null,
			highlightRow: null,
		};
		if (props.simple) {
			this.headerCellWidth = 160;
			this.headerCellHeight = 100;
		}
	}

	private cellWidth(): number {
		return this.props.cellWidth || defaultCellWidth;
	}

	private cellHeight(): number {
		return this.props.cellHeight || defaultCellHeight;
	}

	private renderLeftHeader(): React.ReactNode {
		const { t } = this.props;
		if (this.props.simple) {
			return (
				<div
					className="matchup-header-cell matchup-header-top-left"
					style={{
						width: this.headerCellWidth,
						height: this.headerCellHeight,
					}}
				>
					{t("Archetypes")}
				</div>
			);
		}
		return (
			<div
				className="matchup-header-cell matchup-header-top-left matchup-header-archetype"
				style={{
					height: this.headerCellHeight,
					width: this.headerCellWidth,
				}}
			>
				{this.getSortHeader("class", t("Archetype"), "ascending")}
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
		archetypes: Archetype[],
		opposingArchetypes: number[],
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
					left: this.headerCellWidth,
					background: "none",
				}}
			>
				<Grid
					cellRenderer={({ columnIndex, key, style }) => {
						const archetype = archetypes.find(
							x => x.id === opposingArchetypes[columnIndex],
						);
						const isIgnored =
							this.props.ignoredColumns.indexOf(archetype.id) !==
							-1;

						return (
							<ColumnHeader
								archetypeId={archetype.id}
								archetypeName={archetype.name}
								archetypePlayerClass={
									archetype.player_class_name
								}
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
													archetype.player_class_name
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
								cardData={this.props.cardData}
								gameType={this.props.gameType}
								linkToArchetype={this.props.columnHeaderLinks}
							/>
						);
					}}
					width={
						width -
						this.headerCellWidth -
						this.rowFooterWidth() -
						scrollbarWidth
					}
					height={this.headerCellHeight}
					columnCount={opposingArchetypes.length}
					columnWidth={this.cellWidth()}
					rowCount={1}
					rowHeight={this.headerCellHeight}
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
		const { t } = this.props;
		if (this.props.simple) {
			return null;
		}
		return (
			<div
				className="matchup-header-cell matchup-header-top-right"
				style={{
					height: this.headerCellHeight,
					width: this.cellWidth(),
					right,
				}}
			>
				{this.getSortHeader(
					"winrate",
					t("EWR"),
					null,
					t("Effective Winrate"),
					t(
						"The expected winrate against all active archetypes, weighted by their popularity.",
					),
				)}
			</div>
		);
	}

	private renderRowHeaders(
		archetypes: Archetype[],
		friendlyArchetypes: number[],
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
				style={{ top: this.headerCellHeight }}
			>
				<Grid
					cellRenderer={({ key, rowIndex, style }) => {
						const archetype = archetypes.find(
							x => x.id === friendlyArchetypes[rowIndex],
						);
						const isFavorite =
							!this.props.simple &&
							this.props.favorites.indexOf(archetype.id) !== -1;

						if (this.isLastFavorite(rowIndex)) {
							style["border-bottom"] =
								spacerSize + "px solid " + offWhite;
						}

						return (
							<RowHeader
								archetypeId={archetype.id}
								archetypeName={archetype.name}
								archetypePlayerClass={
									archetype.player_class_name
								}
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
					width={this.headerCellWidth}
					height={
						height -
						this.headerCellHeight -
						this.columnFooterHeight() -
						scrollbarHeight
					}
					columnCount={1}
					columnWidth={this.headerCellWidth}
					rowCount={friendlyArchetypes.length}
					rowHeight={({ index }) =>
						this.cellHeight() +
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
		archetypeMatchups: ArchetypeData[],
		friendlyArchetypes: number[],
		opposingArchetypes: number[],
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
					top: this.headerCellHeight,
					left: this.headerCellWidth,
				}}
			>
				<Grid
					cellRenderer={({ columnIndex, key, rowIndex, style }) => {
						const friendlyArchetype = archetypeMatchups.find(
							x => x.id === friendlyArchetypes[rowIndex],
						);
						const matchup = friendlyArchetype.matchups.find(
							x =>
								x.opponentId ===
								opposingArchetypes[columnIndex],
						);
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

						const { vodsIndexData } = this.props;

						const hasVods =
							vodsIndexData &&
							vodsIndexData[friendlyArchetype.id] &&
							this.props.vodsIndexData[
								friendlyArchetype.id
							].indexOf(matchup.opponentId) !== -1;

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
								minGames={this.props.minGames}
								ignoreMirror={this.props.ignoreMirror}
								colorStyle={this.props.cellColorStyle}
								hasVods={hasVods}
							/>
						);
					}}
					scrollToAlignment="start"
					scrollToColumn={0}
					scrollToRow={0}
					width={Math.min(
						this.cellWidth() * opposingArchetypes.length +
							scrollbarWidth,
						width - this.headerCellWidth - this.rowFooterWidth(),
					)}
					height={Math.min(
						this.cellHeight() * friendlyArchetypes.length +
							scrollbarHeight,
						height -
							this.headerCellHeight -
							this.columnFooterHeight(),
					)}
					columnCount={opposingArchetypes.length}
					columnWidth={this.cellWidth()}
					rowCount={friendlyArchetypes.length}
					rowHeight={({ index }) =>
						this.cellHeight() +
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
		const { t } = this.props;
		if (this.props.simple) {
			return null;
		}
		return (
			<div
				className="matchup-header-cell matchup-header-bottom-left matchup-header-popularity"
				style={{
					height: footerCellHeight,
					width: this.headerCellWidth,
					bottom,
				}}
			>
				{this.getSortHeader(
					"popularity",
					t("Popularity"),
					null,
					t("Popularity on Ladder"),
					t(
						"The percentage of decks played that belong to this archetype.",
					),
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
					<span className="text-nowrap">{t("Custom weights")}</span>
					<InfoIcon
						header={t("Custom weights")}
						content={t(
							"Check this box to provide your own popularity weights, e.g. based on tournament popularity data you may have.",
						)}
					/>
				</label>
			</div>
		);
	}

	private renderColumnFooter(
		archetypeMatchups: ArchetypeData[],
		opposingArchetypes: number[],
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
					left: this.headerCellWidth,
					bottom,
				}}
			>
				<Grid
					cellRenderer={({ columnIndex, key, style }) => {
						const archetype = archetypeMatchups.find(
							x => x.id === opposingArchetypes[columnIndex],
						);
						return (
							<ColumnFooter
								highlight={
									this.state.highlightColumn === columnIndex
								}
								max={this.props.maxPopularity}
								style={style}
								weight={
									this.props.useCustomWeights
										? this.props.customWeights[
												archetype.id
										  ] || 0
										: archetype.popularityTotal
								}
								editable={this.props.useCustomWeights}
								onWeightChanged={(popularity: number) => {
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
						this.headerCellWidth -
						this.rowFooterWidth() -
						scrollbarWidth
					}
					height={footerCellHeight}
					columnCount={opposingArchetypes.length}
					columnWidth={this.cellWidth()}
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
		archetypeMatchups: ArchetypeData[],
		friendlyArchetypes: number[],
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
					top: this.headerCellHeight,
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
								archetypeData={archetypeMatchups.find(
									x => x.id === friendlyArchetypes[rowIndex],
								)}
								highlight={this.state.highlightRow === rowIndex}
								key={key}
								style={style}
							/>
						);
					}}
					width={this.cellWidth()}
					height={
						height -
						this.headerCellHeight -
						footerCellHeight -
						scrollbarHeight
					}
					columnCount={1}
					columnWidth={this.cellWidth()}
					rowCount={friendlyArchetypes.length}
					rowHeight={({ index }) =>
						this.cellHeight() +
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
		return this.props.simple ? 0 : this.cellWidth();
	}

	private columnFooterHeight(): number {
		return this.props.simple ? 0 : footerCellHeight;
	}

	public render(): React.ReactNode {
		const friendlyArchetypes = this.props.friendlyArchetypes.slice(
			0,
			this.props.maxArchetypes,
		);
		const opposingArchetypes = this.props.opposingArchetypes.slice(
			0,
			this.props.maxArchetypes,
		);

		const gridWidth = this.cellWidth() * opposingArchetypes.length;
		const gridHeight = this.cellHeight() * friendlyArchetypes.length;

		const totalHeight =
			gridHeight + this.headerCellHeight + this.columnFooterHeight();

		const totalWidth =
			gridWidth + this.headerCellWidth + this.rowFooterWidth();

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
											this.props.allArchetypes,
											opposingArchetypes,
											width,
											clientWidth,
											scrollbarWidth,
											scrollWidth,
											scrollLeft,
											right,
										)}
										{this.renderEwrHeader(right)}
										{this.renderRowHeaders(
											this.props.allArchetypes,
											friendlyArchetypes,
											height,
											clientHeight,
											scrollbarHeight,
											scrollHeight,
											scrollTop,
											bottom,
										)}
										{this.renderMatchupCells(
											this.props.archetypeMatchups,
											friendlyArchetypes,
											opposingArchetypes,
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
											this.props.archetypeMatchups,
											opposingArchetypes,
											width,
											clientWidth,
											scrollbarWidth,
											scrollWidth,
											scrollLeft,
											right,
											bottom,
										)}
										{this.renderEwrCell(
											this.props.archetypeMatchups,
											friendlyArchetypes,
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
		if (this.props.simple) {
			return false;
		}
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

export default translate()(ArchetypeMatrix);
