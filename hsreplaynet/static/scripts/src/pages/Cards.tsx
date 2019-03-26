import _ from "lodash";
import React, { Fragment } from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import AdHelper from "../AdHelper";
import CardData from "../CardData";
import AdContainer from "../components/ads/AdContainer";
import NitropayAdUnit from "../components/ads/NitropayAdUnit";
import CardImage from "../components/CardImage";
import { FilterOption } from "../components/ClassFilter";
import DataInjector from "../components/DataInjector";
import Feature from "../components/Feature";
import InfoboxFilter from "../components/InfoboxFilter";
import InfoboxFilterGroup from "../components/InfoboxFilterGroup";
import InfoboxLastUpdated from "../components/InfoboxLastUpdated";
import TableLoading from "../components/loading/TableLoading";
import PremiumWrapper from "../components/premium/PremiumWrapper";
import ResetHeader from "../components/ResetHeader";
import CardTable from "../components/tables/CardTable";
import PrettyRankRange from "../components/text/PrettyRankRange";
import PrettyTimeRange from "../components/text/PrettyTimeRange";
import DataManager, { QueryParams } from "../DataManager";
import { RankRange, TimeRange } from "../filters";
import { cardSorting, image, isWildSet } from "../helpers";
import {
	FragmentChildProps,
	LoadingStatus,
	SortDirection,
} from "../interfaces";
import UserData from "../UserData";
import {
	ClassFilter,
	CostFilter,
	MechanicsFilter,
	RarityFilter,
	SetFilter,
	TextFilter,
	TribeFilter,
	TypeFilter,
} from "../components/cards/filters";
import CardFilterManager, {
	CardFilterFunction,
} from "../components/cards/CardFilterManager";
import { CardData as HearthstoneJSONCardData } from "hearthstonejson-client";
import CardFilter from "../components/cards/CardFilter";
import memoize from "memoize-one";
import { Collection } from "../utils/api";
import { getCollectionCardCount } from "../utils/collection";
import CollectionSetup from "../components/collection/CollectionSetup";
import Modal from "../components/Modal";
import Sticky from "../components/utils/Sticky";
import NetworkNAdUnit from "../components/ads/NetworkNAdUnit";

interface Props extends FragmentChildProps, WithTranslation {
	cardData: CardData;
	collection: Collection | null;

	text?: string;
	setText?: (text: string, debounce?: boolean) => void;
	showSparse?: boolean;
	setShowSparse?: (showSparse: boolean) => void;
	format?: string;
	setFormat?: (format: string) => void;
	gameType?: string;
	setGameType?: (gameType: string) => void;
	playerClass?: string;
	setPlayerClass?: (playerClass: string) => void;
	rankRange?: string;
	setRankRange?: (rankRange: string) => void;
	timeRange?: string;
	setTimeRange?: (timeRange: string) => void;
	exclude?: string;
	setExclude?: (exclude: string) => void;

	cost?: string[];
	setCost?: (cost: string[]) => void;
	rarity?: string[];
	setRarity?: (rarity: string[]) => void;
	set?: string[];
	setSet?: (set: string[]) => void;
	type?: string[];
	setType?: (type: string[]) => void;
	tribe?: string[];
	setTribe?: (tribes: string[]) => void;
	mechanics?: string[];
	setMechanics?: (mechanics: string[]) => void;
	uncollectible?: string;
	setUncollectible?: (uncollectible: string) => void;

	sortBy?: string;
	setSortBy?: (sortBy: string) => void;
	sortDirection?: SortDirection;
	setSortDirection?: (sortDirection: SortDirection) => void;
	display?: string;
	setDisplay?: (display: string) => void;
}

interface SparseFilterDict {
	[dbfId: number]: number;
}

interface State {
	filteredCards: number[] | null;
	sparseFilterDicts: [SparseFilterDict, SparseFilterDict] | null;
	numCards: number;
	showFilters: boolean;
	showCollectionModal: boolean;
}

const PLACEHOLDER_MINION = image("loading_minion.png");
const PLACEHOLDER_SPELL = image("loading_spell.png");
const PLACEHOLDER_WEAPON = image("loading_weapon.png");
const PLACEHOLDER_HERO = image("loading_hero.png");

class Cards extends React.Component<Props, State> {
	showMoreButton: HTMLDivElement | null = null;

	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			filteredCards: null,
			sparseFilterDicts: null,
			numCards: 24,
			showFilters: false,
			showCollectionModal: false,
		};
	}

	private onSearchScroll = (): void => {
		if (!this.showMoreButton) {
			return;
		}
		if (this.state.numCards >= this.state.filteredCards.length) {
			return;
		}
		const rect = this.showMoreButton.getBoundingClientRect();
		if (rect.top < window.innerHeight) {
			this.setState({ numCards: this.state.numCards + 12 });
		}
	};

	public componentDidMount(): void {
		document.addEventListener("scroll", this.onSearchScroll);
		if (this.props.display === "gallery") {
			this.loadPlaceholders();
		}
		this.loadSparseFilterDicts();
	}

	public componentWillUnmount(): void {
		document.removeEventListener("scroll", this.onSearchScroll);
	}

	public componentDidUpdate(
		prevProps: Readonly<Props>,
		prevState: Readonly<State>,
		prevContext: any,
	): void {
		if (prevProps.display !== this.props.display) {
			if (this.props.display === "gallery") {
				this.loadPlaceholders();
			}
		}

		if (UserData.hasFeature("current-arena-event-filter")) {
			if (
				prevProps.timeRange !== "ARENA_EVENT" &&
				this.props.timeRange === "ARENA_EVENT"
			) {
				this.props.setGameType("ARENA");
			}
			if (
				prevProps.gameType !== "ARENA" &&
				this.props.gameType === "ARENA"
			) {
				this.props.setTimeRange("ARENA_EVENT");
			}
			if (
				this.props.timeRange === "ARENA_EVENT" &&
				prevProps.gameType === "ARENA" &&
				this.props.gameType !== "ARENA"
			) {
				this.props.reset("timeRange");
			}
		}

		if (
			prevProps.gameType !== this.props.gameType ||
			prevProps.timeRange !== this.props.timeRange ||
			prevProps.rankRange !== this.props.rankRange
		) {
			this.loadSparseFilterDicts();
		}
	}

	loadSparseFilterDicts(): void {
		if (!this.isStatsView() || this.props.showSparse) {
			return;
		}
		const params = this.getParams(this.props);
		const promises = [
			DataManager.get("card_played_popularity_report", params),
			DataManager.get("card_included_popularity_report", params),
		];
		Promise.all(promises).then(
			data => {
				const sparseDict: [SparseFilterDict, SparseFilterDict] = [
					{},
					{},
				];
				const playedData = data[0].series.data[this.props.playerClass];
				playedData.forEach(card => {
					sparseDict[0][card.dbf_id] = card.popularity;
				});
				const includedData =
					data[1].series.data[this.props.playerClass];
				includedData.forEach(card => {
					sparseDict[1][card.dbf_id] = card.popularity;
				});
				this.setState({ sparseFilterDicts: sparseDict });
			},
			status => {},
		);
	}

	public render(): React.ReactNode {
		const { t } = this.props;

		const backButton = (
			<button
				className="btn btn-primary btn-full visible-xs"
				type="button"
				onClick={() => this.setState({ showFilters: false })}
			>
				{t("Back to card list")}
			</button>
		);

		const filterClassNames = ["infobox full-xs"];
		const contentClassNames = ["card-list-wrapper"];

		if (this.state.showFilters) {
			contentClassNames.push("hidden-xs");
		} else {
			filterClassNames.push("hidden-xs");
		}

		return (
			<CardFilterManager
				cardData={this.props.cardData}
				onFilter={dbfs =>
					this.setState({
						filteredCards: dbfs /*dbfs
							.map(dbf => this.props.cardData.fromDbf(dbf))
							.filter(card => this.filter(card))*/,
					})
				}
				collectible={!this.props.uncollectible}
			>
				<Modal
					visible={this.state.showCollectionModal}
					onClose={() =>
						this.setState({ showCollectionModal: false })
					}
				>
					<CollectionSetup />
				</Modal>
				<NetworkNAdUnit
					id="nn_mobile_lb1_sticky"
					uniqueId="cl-mlb1"
					mobile
				/>
				<div className="cards">
					<aside
						className={filterClassNames.join(" ")}
						id="cards-infobox"
					>
						{backButton}
						{this.renderFilters()}
						{backButton}
						<NitropayAdUnit id="cl-d-3" size="300x250" />
						<NitropayAdUnit id="cl-d-4" size="300x250" />
					</aside>
					<main className={contentClassNames.join(" ")}>
						<AdContainer>
							<NitropayAdUnit id="cl-d-1" size="728x90" />
							<NitropayAdUnit id="cl-d-2" size="728x90" />
						</AdContainer>
						<Sticky top={10}>
							<NetworkNAdUnit
								id="nn_lb1"
								uniqueId="cl-bb1"
								center
							/>
						</Sticky>
						<NitropayAdUnit id="cl-m-1" size="320x50" mobile />
						<NetworkNAdUnit
							id="nn_mobile_mpu2"
							uniqueId="cl-mmpu2"
							mobile
							center
						/>
						<button
							className="btn btn-default visible-xs"
							id="filter-button"
							type="button"
							onClick={() =>
								this.setState({
									showFilters: !this.state.showFilters,
								})
							}
						>
							<span className="glyphicon glyphicon-filter" />
							{t("Filters")}
						</button>
						{this.renderSearch()}
						{this.renderContent()}
					</main>
				</div>
			</CardFilterManager>
		);
	}

	resetFilters(): void {
		this.props.reset();
	}

	private filterGameType = memoize(
		(gameType: string): CardFilterFunction | null => {
			if (gameType === "RANKED_WILD") {
				return null;
			}
			return (card: HearthstoneJSONCardData) => !isWildSet(card.set);
		},
	);

	private filterClass = memoize(
		(exclude: string): CardFilterFunction | null => {
			switch (exclude) {
				case "class":
					return (card: HearthstoneJSONCardData) =>
						card.cardClass === "NEUTRAL";
				case "neutral":
					return (card: HearthstoneJSONCardData) =>
						card.cardClass !== "NEUTRAL";
			}
			return null;
		},
	);

	renderFilters(): React.ReactNode {
		const showReset = this.props.canBeReset;
		const isStatsView = this.isStatsView();
		const { t } = this.props;

		const filters = [
			<ResetHeader
				key="reset"
				onReset={() => this.resetFilters()}
				showReset={showReset}
			>
				{isStatsView ? t("Cards") : t("Gallery")}
			</ResetHeader>,
		];

		const modeFilter = (
			<section id="mode-filter" key="mode-filter">
				<InfoboxFilterGroup
					header={t("Game Mode")}
					selectedValue={this.props.gameType}
					onClick={value => this.props.setGameType(value)}
				>
					<InfoboxFilter value="RANKED_STANDARD">
						{t("Ranked Standard")}
					</InfoboxFilter>
					<InfoboxFilter value="RANKED_WILD">
						{t("Ranked Wild")}
					</InfoboxFilter>
					<InfoboxFilter value="ARENA">{t("Arena")}</InfoboxFilter>
					<CardFilter
						filter={this.filterGameType(this.props.gameType)}
					/>
				</InfoboxFilterGroup>
			</section>
		);

		filters.push(
			<InfoboxFilterGroup
				header={t("Display")}
				selectedValue={this.props.display}
				onClick={value => this.props.setDisplay(value)}
				key="display"
			>
				<InfoboxFilter value="statistics">
					{t("Statistics view")}
				</InfoboxFilter>
				<InfoboxFilter
					value="crafting"
					onClick={
						this.props.collection === null
							? () => this.setState({ showCollectionModal: true })
							: null
					}
				>
					{t("Crafting view")}
				</InfoboxFilter>
				<InfoboxFilter value="gallery">
					{t("Gallery view")}
				</InfoboxFilter>
			</InfoboxFilterGroup>,
		);

		const classFilter = (
			<Fragment key="class-filter">
				<ClassFilter
					title={isStatsView ? t("Deck Class") : undefined}
					filters="All"
					value={
						this.props.playerClass !== "ALL"
							? // neutral cards will be filtered out by the exclude filter
							  [this.props.playerClass as FilterOption]
							: []
					}
					onChange={value =>
						value.length > 0
							? this.props.setPlayerClass(value[0])
							: "ALL"
					}
					multiSelect={false}
					includeNeutral
				/>
				<InfoboxFilterGroup
					deselectable
					selectedValue={this.props.exclude}
					onClick={value => this.props.setExclude(value)}
				>
					<InfoboxFilter value="neutral">
						{t("Class cards only")}
					</InfoboxFilter>
					<InfoboxFilter value="class">
						{t("Neutral cards only")}
					</InfoboxFilter>
					<CardFilter filter={this.filterClass(this.props.exclude)} />
				</InfoboxFilterGroup>
			</Fragment>
		);

		if (isStatsView) {
			filters.push(
				<Fragment key="class">
					{classFilter}
					{modeFilter}
					<section>
						<InfoboxFilterGroup
							header={t("Time frame")}
							infoHeader={t("Time frame")}
							infoContent={t(
								"Get the most recent data on which cards are hot right now!",
							)}
							selectedValue={this.props.timeRange}
							onClick={value => this.props.setTimeRange(value)}
						>
							<PremiumWrapper
								analyticsLabel="Card List Time Frame"
								iconStyle={{ display: "none" }}
								modalStyle="TimeRankRegion"
							>
								<InfoboxFilter value={TimeRange.LAST_1_DAY}>
									<PrettyTimeRange
										timeRange={TimeRange.LAST_1_DAY}
									/>
								</InfoboxFilter>
								<InfoboxFilter value={TimeRange.LAST_3_DAYS}>
									<PrettyTimeRange
										timeRange={TimeRange.LAST_3_DAYS}
									/>
								</InfoboxFilter>
								<InfoboxFilter value={TimeRange.LAST_7_DAYS}>
									<PrettyTimeRange
										timeRange={TimeRange.LAST_7_DAYS}
									/>
								</InfoboxFilter>
							</PremiumWrapper>
							<InfoboxFilter value={TimeRange.LAST_14_DAYS}>
								<PrettyTimeRange
									timeRange={TimeRange.LAST_14_DAYS}
								/>
							</InfoboxFilter>
							<Feature feature={"current-expansion-filter"}>
								<InfoboxFilter
									value={TimeRange.CURRENT_EXPANSION}
								>
									<PrettyTimeRange
										timeRange={TimeRange.CURRENT_EXPANSION}
									/>
									<span className="infobox-value">
										{t("New!")}
									</span>
								</InfoboxFilter>
							</Feature>
							<Feature feature={"current-patch-filter"}>
								<InfoboxFilter value={TimeRange.CURRENT_PATCH}>
									<PrettyTimeRange
										timeRange={TimeRange.CURRENT_PATCH}
									/>
									<span className="infobox-value">
										{t("New!")}
									</span>
								</InfoboxFilter>
							</Feature>
							<Feature feature={"current-arena-event-filter"}>
								<InfoboxFilter
									value={TimeRange.ARENA_EVENT}
									disabled={this.props.gameType !== "ARENA"}
								>
									<PrettyTimeRange
										timeRange={TimeRange.ARENA_EVENT}
									/>
									<span className="infobox-value">
										{t("New!")}
									</span>
								</InfoboxFilter>
							</Feature>
						</InfoboxFilterGroup>
					</section>
					<InfoboxFilterGroup
						header={t("Rank range")}
						infoHeader={t("Rank range")}
						infoContent={t(
							"Check out which cards are played at certain rank ranges on the ranked ladder!",
						)}
						onClick={value => this.props.setRankRange(value)}
						selectedValue={
							this.props.gameType !== "ARENA" &&
							this.props.rankRange
						}
						disabled={this.props.gameType === "ARENA"}
					>
						<PremiumWrapper
							analyticsLabel="Card List Rank Range"
							iconStyle={{ display: "none" }}
							modalStyle="TimeRankRegion"
						>
							<InfoboxFilter value={RankRange.LEGEND_ONLY}>
								<PrettyRankRange
									rankRange={RankRange.LEGEND_ONLY}
								/>
							</InfoboxFilter>
							<InfoboxFilter
								value={RankRange.LEGEND_THROUGH_FIVE}
							>
								<PrettyRankRange
									rankRange={RankRange.LEGEND_THROUGH_FIVE}
								/>
							</InfoboxFilter>
							<InfoboxFilter value={RankRange.LEGEND_THROUGH_TEN}>
								<PrettyRankRange
									rankRange={RankRange.LEGEND_THROUGH_TEN}
								/>
							</InfoboxFilter>
						</PremiumWrapper>
						<InfoboxFilter value={RankRange.ALL}>
							<PrettyRankRange rankRange={RankRange.ALL} />
						</InfoboxFilter>
					</InfoboxFilterGroup>
				</Fragment>,
			);
		} else {
			filters.push(classFilter);
		}

		if (isStatsView) {
			filters.push(
				<Fragment key="data">
					<h2>{t("Data")}</h2>
					<ul>
						<InfoboxLastUpdated
							url={"card_played_popularity_report"}
							params={this.getParams(this.props)}
						/>
					</ul>
					<InfoboxFilterGroup
						deselectable
						selectedValue={this.props.showSparse ? "show" : null}
						onClick={value =>
							this.props.setShowSparse(
								value === "show" ? true : false,
							)
						}
					>
						<InfoboxFilter value="show">
							{t("Show sparse data")}
						</InfoboxFilter>
					</InfoboxFilterGroup>
				</Fragment>,
			);
		}

		filters.push(
			<Fragment key="card-filter">
				<CostFilter
					onChange={value => this.props.setCost(value)}
					value={this.props.cost}
				/>
				<RarityFilter
					value={this.props.rarity}
					onChange={value => this.props.setRarity(value)}
				/>
				<TypeFilter
					value={this.props.type}
					onChange={value => this.props.setType(value)}
				/>
				<SetFilter
					onChange={value => this.props.setSet(value)}
					value={this.props.set}
				/>
				<TribeFilter
					value={this.props.tribe}
					onChange={value => this.props.setTribe(value)}
				/>
				<MechanicsFilter
					value={this.props.mechanics}
					onChange={value => this.props.setMechanics(value)}
				/>
			</Fragment>,
		);

		if (this.props.display === "gallery") {
			filters.push(
				<InfoboxFilterGroup
					key="uncollectible"
					header={t("Uncollectible")}
					deselectable
					selectedValue={this.props.uncollectible}
					onClick={value => this.props.setUncollectible(value)}
				>
					<InfoboxFilter value="show">
						{t("Show uncollectible cards")}
					</InfoboxFilter>
				</InfoboxFilterGroup>,
			);
		}

		filters.push(
			<>
				<NetworkNAdUnit id="nn_mpu1" uniqueId="cl-mpu1" />
				<Sticky bottom={0} key="networkn-ad">
					<NetworkNAdUnit id="nn_mpu2" uniqueId="cl-mpu2" />
				</Sticky>
			</>,
		);

		return filters;
	}

	renderSearch(): React.ReactNode {
		if (this.state.showFilters) {
			return null;
		}
		return (
			<TextFilter
				value={this.props.text}
				onChange={value => this.props.setText(value)}
			/>
		);
	}

	renderContent(): React.ReactNode {
		const { t } = this.props;
		const isStatsView = this.isStatsView();

		if (!this.props.cardData || this.state.filteredCards === null) {
			return (
				<TableLoading
					cardData={this.props.cardData}
					status={LoadingStatus.LOADING}
				/>
			);
		}

		let showMoreButton = null;
		if (
			this.state.filteredCards &&
			this.state.filteredCards.length > this.state.numCards
		) {
			showMoreButton = (
				<div
					id="more-button-wrapper"
					ref={ref => (this.showMoreButton = ref)}
				>
					<button
						type="button"
						className="btn btn-default"
						onClick={() =>
							this.setState({
								numCards: this.state.numCards + 20,
							})
						}
					>
						Show more…
					</button>
				</div>
			);
		}

		if (isStatsView) {
			const dataKey =
				this.props.playerClass === "NEUTRAL"
					? "ALL"
					: this.props.playerClass;
			let topInfoMessage = null;
			let bottomInfomessage = null;
			const warnFields = [
				"includedPopularity",
				"timesPlayed",
				"includedWinrate",
				"playedWinrate",
			];
			const { cards, hasSparse } = this.filterSparse(
				this.state.filteredCards.map(dbfId =>
					this.props.cardData.fromDbf(dbfId),
				),
			);

			if (!this.props.showSparse && hasSparse) {
				const warning = (
					<div className="info-row text-center">
						<span className="hidden-xs hidden-sm">
							{t(
								"Some cards were hidden due to a low amount of data.",
							)}&nbsp;&nbsp;
						</span>
						<a
							href="#"
							className="btn btn-primary"
							onClick={event => {
								event.preventDefault();
								this.props.setShowSparse(true);
							}}
						>
							{t("Show sparse data")}
						</a>
					</div>
				);
				if (
					this.props.sortDirection === "ascending" &&
					warnFields.indexOf(this.props.sortBy) !== -1
				) {
					topInfoMessage = warning;
				} else {
					bottomInfomessage = warning;
				}
			}
			return (
				<>
					<div className="table-wrapper">
						<DataInjector
							query={[
								{
									key: "played",
									url: "card_played_popularity_report",
									params: this.getParams(this.props),
								},
								{
									key: "included",
									url: "card_included_popularity_report",
									params: this.getParams(this.props),
								},
							]}
							extract={{
								played: (played, props) => {
									if (!props.included) {
										return null;
									}
									const data = {};
									const set = (
										dbfId: number,
										key: string,
										value: number,
									) => {
										if (!data[dbfId]) {
											data[dbfId] = { dbf_id: dbfId };
										}
										data[dbfId][key] = value;
									};
									played.series.data[dataKey].forEach(
										playedData => {
											const {
												dbf_id,
												popularity,
												winrate,
												total,
											} = playedData;
											set(
												dbf_id,
												"played_popularity",
												+popularity,
											);
											set(
												dbf_id,
												"winrate_when_played",
												winrate,
											);
											set(dbf_id, "times_played", total);
										},
									);
									props.included.series.data[dataKey].forEach(
										includedData => {
											const {
												count,
												dbf_id,
												decks,
												popularity,
												winrate,
											} = includedData;
											set(
												dbf_id,
												"included_count",
												count,
											);
											set(
												dbf_id,
												"included_decks",
												decks,
											);
											set(
												dbf_id,
												"included_popularity",
												popularity,
											);
											set(
												dbf_id,
												"included_winrate",
												winrate,
											);
										},
									);
									return {
										data: Object.keys(data).map(
											key => data[key],
										),
									};
								},
							}}
						>
							<CardTable
								cards={cards.map(card => ({
									card,
									count:
										this.props.collection !== null &&
										this.props.display === "crafting"
											? getCollectionCardCount(
													this.props.collection,
													card.dbfId,
											  )
											: 1,
								}))}
								columns={[
									"includedPopularity",
									"includedCount",
									"includedWinrate",
									"timesPlayedTotal",
									"playedPopularity",
									"playedWinrate",
								]}
								sortBy={this.props.sortBy}
								sortDirection={this.props.sortDirection}
								onSortChanged={(a, b) =>
									this.onSortChanged(a, b)
								}
								numCards={this.state.numCards}
								topInfoRow={topInfoMessage}
								bottomInfoRow={bottomInfomessage}
								adInterval={12}
								ads={_.range(5, 100, 2).map(x => {
									const ads = [`cl-d-${x}`, `cl-d-${x + 1}`];
									const showAds =
										ads.some(ad =>
											AdHelper.isAdEnabled(ad),
										) && !UserData.hasFeature("networkn");
									return showAds ? (
										<>
											<AdContainer
												key={`ads-${x}-${x + 1}`}
											>
												<NitropayAdUnit
													id={ads[0]}
													size="728x90"
												/>
												<NitropayAdUnit
													id={ads[1]}
													size="728x90"
												/>
											</AdContainer>
											<NitropayAdUnit
												id={`cl-m-${Math.floor(x / 2)}`}
												size="320x50"
												mobile
											/>
										</>
									) : null;
								})}
								collection={
									this.props.display === "crafting"
										? this.props.collection
										: null
								}
							/>
						</DataInjector>
					</div>
					{showMoreButton}
				</>
			);
		} else {
			const cards = this.state.filteredCards.map(dbfId =>
				this.props.cardData.fromDbf(dbfId),
			);
			cards.sort(cardSorting);
			const tiles = [];
			cards.forEach(card => {
				if (tiles.length < this.state.numCards) {
					tiles.push(
						<CardImage
							card={card}
							placeholder={this.getCardPlaceholder(card)}
							key={card.id}
						/>,
					);
				}
			});
			return (
				<>
					<div id="card-list">{tiles}</div>
					{showMoreButton}
				</>
			);
		}
	}

	filterSparse(
		cards: HearthstoneJSONCardData[],
	): { cards: HearthstoneJSONCardData[]; hasSparse: boolean } {
		if (this.props.showSparse || !this.state.sparseFilterDicts) {
			return { cards, hasSparse: false };
		}

		let hasSparse = false;
		const [allIncluded, allPlayed] = this.state.sparseFilterDicts;

		cards = cards.filter(card => {
			const included = allIncluded[card.dbfId];
			const played = allPlayed[card.dbfId];
			if (!included || !played || +included < 0.01 || +played < 0.01) {
				hasSparse = true;
				return false;
			}
			return true;
		});

		return { cards, hasSparse };
	}

	getParams(props: Props): QueryParams {
		const params = {
			GameType: props.gameType,
			TimeRange: props.timeRange,
		};
		if (props.gameType !== "ARENA") {
			Object.assign(params, {
				RankRange: props.rankRange,
			});
		}
		return params;
	}

	onSortChanged(sortBy, sortDirection): void {
		this.props.setSortBy(sortBy);
		this.props.setSortDirection(sortDirection);
	}

	isStatsView(): boolean {
		return this.props.display !== "gallery";
	}

	getCardPlaceholder(card: any): string {
		switch (card.type) {
			case "WEAPON":
				return PLACEHOLDER_WEAPON;
			case "SPELL":
				return PLACEHOLDER_SPELL;
			case "HERO":
				return PLACEHOLDER_HERO;
			default:
				return PLACEHOLDER_MINION;
		}
	}

	loadPlaceholders(): void {
		const minion = new Image();
		minion.src = PLACEHOLDER_MINION;
		const spell = new Image();
		spell.src = PLACEHOLDER_SPELL;
		const weapon = new Image();
		weapon.src = PLACEHOLDER_WEAPON;
		const hero = new Image();
		hero.src = PLACEHOLDER_HERO;
	}
}

export default withTranslation()(Cards);
