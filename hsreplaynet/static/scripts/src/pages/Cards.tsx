import _ from "lodash";
import React, { Fragment } from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import CardData from "../CardData";
import DataManager from "../DataManager";
import UserData, { Account } from "../UserData";
import CardImage from "../components/CardImage";
import ClassFilter, { FilterOption } from "../components/ClassFilter";
import DataInjector from "../components/DataInjector";
import Feature from "../components/Feature";
import InfoboxFilter from "../components/InfoboxFilter";
import InfoboxFilterGroup from "../components/InfoboxFilterGroup";
import InfoboxLastUpdated from "../components/InfoboxLastUpdated";
import ResetHeader from "../components/ResetHeader";
import TableLoading from "../components/loading/TableLoading";
import PremiumWrapper from "../components/premium/PremiumWrapper";
import CardTable from "../components/tables/CardTable";
import PrettyRankRange from "../components/text/PrettyRankRange";
import PrettyTimeRange from "../components/text/PrettyTimeRange";
import { RankRange, TimeRange } from "../filters";
import {
	cardSorting,
	cleanText,
	getSetName,
	image,
	isArenaOnlyCard,
	isCollectibleCard,
	isPlayableCard,
	isWildSet,
	slangToCardId,
	toTitleCase,
} from "../helpers";
import {
	FragmentChildProps,
	LoadingStatus,
	SortDirection,
} from "../interfaces";
import { Collection } from "../utils/api";
import {
	getCollectionCardCount,
	isCollectionDisabled,
} from "../utils/collection";
import AllSet from "../components/onboarding/AllSet";
import ConnectAccount from "../components/onboarding/ConnectAccount";
import PremiumModal from "../components/premium/PremiumModal";
import Modal from "../components/Modal";

interface CardFilters {
	cost: any;
	format: any;
	mechanics: any;
	playerClass: any;
	race: any;
	rarity: any;
	set: any;
	type: any;
}

interface Props extends FragmentChildProps, InjectedTranslateProps {
	cardData: CardData;
	personal: boolean;
	collection: Collection | null;
	account: Account | null;

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
	toggleCost?: (cost: string) => void;
	rarity?: string[];
	setRarity?: (rarity: string[]) => void;
	toggleRarity?: (rarity: string) => void;
	set?: string[];
	setSet?: (set: string[]) => void;
	toggleSet?: (set: string) => void;
	type?: string[];
	setType?: (type: string[]) => void;
	toggleType?: (type: string) => void;
	race?: string[];
	setRace?: (races: string[]) => void;
	toggleRace?: (race: string) => void;
	mechanics?: string[];
	setMechanics?: (mechanics: string[]) => void;
	toggleMechanics?: (mechanic: string) => void;
	uncollectible?: string;
	setUncollectible?: (uncollectible: string) => void;

	sortBy?: string;
	setSortBy?: (sortBy: string) => void;
	sortDirection?: SortDirection;
	setSortDirection?: (sortDirection: SortDirection) => void;
	display?: string;
	setDisplay?: (display: string) => void;
}

interface State {
	cards: any[];
	filteredCards: any[];
	filterCounts: CardFilters;
	hasPersonalData: boolean;
	hasStatisticsData: boolean;
	numCards: number;
	showFilters: boolean;
}

const PLACEHOLDER_MINION = image("loading_minion.png");
const PLACEHOLDER_SPELL = image("loading_spell.png");
const PLACEHOLDER_WEAPON = image("loading_weapon.png");
const PLACEHOLDER_HERO = image("loading_hero.png");

class Cards extends React.Component<Props, State> {
	static readonly FILTERS = {
		cost: [0, 1, 2, 3, 4, 5, 6, 7],
		format: ["standard"],
		mechanics: [
			"DEATHRATTLE",
			"TAUNT",
			"BATTLECRY",
			"CHARGE",
			"DIVINE_SHIELD",
			"WINDFURY",
			"CHOOSE_ONE",
			"INSPIRE",
			"JADE_GOLEM",
			"COMBO",
			"FREEZE",
			"STEALTH",
			"OVERLOAD",
			"POISONOUS",
			"DISCOVER",
			"SILENCE",
			"RITUAL",
			"ADAPT",
			"QUEST",
			"LIFESTEAL",
			"SECRET",
			"ECHO",
			"RUSH",
		].sort(),
		playerClass: [
			"DRUID",
			"HUNTER",
			"MAGE",
			"PALADIN",
			"PRIEST",
			"ROGUE",
			"SHAMAN",
			"WARLOCK",
			"WARRIOR",
			"NEUTRAL",
		],
		race: [
			"BEAST",
			"DEMON",
			"DRAGON",
			"ELEMENTAL",
			"MECHANICAL",
			"MURLOC",
			"PIRATE",
			"TOTEM",
		],
		rarity: ["FREE", "COMMON", "RARE", "EPIC", "LEGENDARY"],
		set: [
			"CORE",
			"EXPERT1",
			"GILNEAS",
			"LOOTAPALOOZA",
			"ICECROWN",
			"UNGORO",
			"GANGS",
			"KARA",
			"OG",
			"LOE",
			"TGT",
			"BRM",
			"GVG",
			"NAXX",
			"HOF",
			"TAVERNS_OF_TIME",
		],
		type: ["HERO", "MINION", "SPELL", "WEAPON"],
	};
	readonly multiClassGroups = {
		GRIMY_GOONS: ["HUNTER", "PALADIN", "WARRIOR"],
		JADE_LOTUS: ["DRUID", "ROGUE", "SHAMAN"],
		KABAL: ["MAGE", "PRIEST", "WARLOCK"],
	};

	private readonly allowedValues = {
		gameType: ["RANKED_STANDARD", "RANKED_WILD", "ARENA"],
		rankRange: [],
		region: [],
		timeRange: [TimeRange.LAST_14_DAYS],
	};

	private readonly allowedValuesPremium = {
		gameType: ["RANKED_STANDARD", "RANKED_WILD", "ARENA"],
		rankRange: [RankRange.LEGEND_THROUGH_TEN],
		region: [],
		timeRange: [
			TimeRange.LAST_1_DAY,
			TimeRange.LAST_3_DAYS,
			TimeRange.LAST_7_DAYS,
			TimeRange.LAST_14_DAYS,
		],
	};

	showMoreButton: HTMLDivElement;

	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			cards: null,
			filterCounts: null,
			filteredCards: [],
			hasPersonalData: false,
			hasStatisticsData: false,
			numCards: 24,
			showFilters: false,
		};
	}

	getAllowedValues(): any {
		return UserData.isPremium()
			? this.allowedValuesPremium
			: this.allowedValues;
	}

	onSearchScroll(): void {
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
	}

	private scrollCb;

	public componentDidMount(): void {
		if (this.props.personal && this.props.account) {
			DataManager.get(
				"single_account_lo_individual_card_stats",
				this.getPersonalParams(),
			).then(data =>
				this.setState({
					hasPersonalData: data && data.series.data.ALL.length > 0,
				}),
			);
		}

		this.scrollCb = () => this.onSearchScroll();
		document.addEventListener("scroll", this.scrollCb);
		if (this.props.display === "gallery") {
			this.loadPlaceholders();
		}
	}

	public componentWillUnmount(): void {
		document.removeEventListener("scroll", this.scrollCb);
	}

	public componentDidUpdate(
		prevProps: Readonly<Props>,
		prevState: Readonly<State>,
		prevContext: any,
	): void {
		if (!this.props.personal && prevProps.display !== this.props.display) {
			if (this.props.display === "gallery") {
				this.loadPlaceholders();
			}
		}

		// omit functions (not supported) and unused custom* props to prevent multiple update calls
		const ignore = Object.keys(this.props)
			.filter(key => {
				return (
					(key.startsWith("set") && key !== "set") ||
					key.startsWith("toggle") ||
					key.startsWith("custom")
				);
			})
			.concat(["reset"]);

		if (
			!_.isEqual(_.omit(this.props, ignore), _.omit(prevProps, ignore)) ||
			!this.state.filteredCards ||
			!_.eq(prevState.cards, this.state.cards) ||
			this.props.account !== prevProps.account
		) {
			this.updateFilteredCards();
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
	}

	updateFilteredCards(): void {
		if (!this.state.cards) {
			return;
		}

		const filteredByProp = {};
		const filterKeys = Object.keys(Cards.FILTERS);
		filterKeys.forEach(key => (filteredByProp[key] = []));
		const filteredCards = [];

		const { display, uncollectible } = this.props;
		const showUncollectible =
			display === "gallery" &&
			uncollectible === "show" &&
			!this.props.personal;

		const viableUncollectibleCard = card =>
			!card.collectible &&
			Cards.FILTERS.set.indexOf(card.set) !== -1 &&
			card.type !== "HERO" &&
			isPlayableCard(card);

		(!this.props.showSparse
			? this.getSparseFilterDicts()
			: Promise.resolve([])
		).then(sparseDict => {
			this.state.cards.forEach(card => {
				if (isArenaOnlyCard(card)) {
					if (
						this.isStatsView() &&
						(showUncollectible || this.props.gameType !== "ARENA")
					) {
						return;
					}
				} else if (
					(showUncollectible && !viableUncollectibleCard(card)) ||
					(!showUncollectible && !isCollectibleCard(card))
				) {
					return;
				}
				filterKeys.forEach(x => {
					if (!this.filter(card, x, sparseDict)) {
						filteredByProp[x].push(card);
					}
				});
				if (!this.filter(card, undefined, sparseDict)) {
					filteredCards.push(card);
				}
			});

			this.setState({
				filteredCards,
				filterCounts: this.filterCounts(filteredByProp as CardFilters),
				hasStatisticsData: true,
			});
		});
	}

	getSparseFilterDicts(): Promise<any> {
		// build dictionaries from the tabledata to optimize lookup time when filtering
		if (this.isStatsView()) {
			const params = this.getParams();
			const promises = [
				DataManager.get("card_played_popularity_report", params),
				DataManager.get("card_included_popularity_report", params),
			];
			return Promise.all(promises).then(
				(data: any[]) => {
					const sparseDict = [];
					sparseDict[0] = {};
					const playedData =
						data[0].series.data[this.props.playerClass];
					playedData.forEach(card => {
						sparseDict[0][card.dbf_id] = card.popularity;
					});
					sparseDict[1] = {};
					const includedData =
						data[1].series.data[this.props.playerClass];
					includedData.forEach(card => {
						sparseDict[1][card.dbf_id] = card.popularity;
					});
					return sparseDict;
				},
				status => {
					return [];
				},
			);
		} else if (this.props.personal && this.props.account) {
			return DataManager.get(
				"single_account_lo_individual_card_stats",
				this.getPersonalParams(),
			).then(
				data => {
					const sparseDict = {};
					data.series.data.ALL.forEach(card => {
						sparseDict[card.dbf_id] =
							card.total_games || card.times_played;
					});
					return [sparseDict];
				},
				status => {
					return [];
				},
			);
		} else {
			return Promise.resolve([]);
		}
	}

	static getDerivedStateFromProps(
		nextProps: Readonly<Props>,
		prevState: State,
	): Partial<State> | null {
		if (!prevState.cards && nextProps.cardData) {
			const cards = [];
			const { set, type } = Cards.FILTERS;
			nextProps.cardData.all().forEach(card => {
				if (
					card.name &&
					set.indexOf(card.set) !== -1 &&
					type.indexOf(card.type) !== -1
				) {
					cards.push(card);
				}
			});
			cards.sort(cardSorting);
			return { cards };
		}
		return null;
	}

	public render(): React.ReactNode {
		const { t } = this.props;
		const isStatsView = this.isStatsView();
		const content = [];

		let showMoreButton = null;

		if (this.state.filteredCards.length > this.state.numCards) {
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

		if (this.props.personal) {
			if (!UserData.isPremium()) {
				return (
					<Modal
						visible
						onClose={() => window.open("/premium/", "_self")}
					>
						<PremiumModal modalStyle="MyCards" />
					</Modal>
				);
			}

			if (this.props.account) {
				content.push(
					<div className="table-wrapper">
						<DataInjector
							query={{
								params: this.getPersonalParams(),
								url: "single_account_lo_individual_card_stats",
							}}
							extract={{
								data: data => ({ data: data.series.data.ALL }),
							}}
						>
							<CardTable
								cards={(this.state.filteredCards || []).map(
									card => ({ card, count: 1 }),
								)}
								columns={[
									"totalGames",
									"winrate",
									"timesPlayedPersonal",
									"distinctDecks",
									"damageDone",
									"healingDone",
									"heroesKilled",
									"minionsKilled",
								]}
								sortBy={this.props.sortBy}
								sortDirection={this.props.sortDirection}
								onSortChanged={(a, b) =>
									this.onSortChanged(a, b)
								}
								numCards={this.state.numCards}
								customNoDataMessage={
									<AllSet
										account={this.props.account}
										feature={t(
											"personalized deck statistics",
										)}
									>
										{t(
											"After you've played some games you'll find statistics for all the cards you play right here.",
										)}
									</AllSet>
								}
							/>
						</DataInjector>
					</div>,
				);
				if (showMoreButton && this.state.hasPersonalData) {
					content.push(showMoreButton);
				}
			} else {
				content.push(
					<div className="message-wrapper">
						<ConnectAccount
							feature={t("personalized card statistics")}
						/>
					</div>,
				);
			}
		} else if (isStatsView) {
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
			if (!this.props.showSparse) {
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
			content.push(
				<div className="table-wrapper">
					<DataInjector
						query={[
							{
								key: "played",
								url: "card_played_popularity_report",
								params: this.getParams(),
							},
							{
								key: "included",
								url: "card_included_popularity_report",
								params: this.getParams(),
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
										set(dbf_id, "included_count", count);
										set(dbf_id, "included_decks", decks);
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
							cards={(this.state.filteredCards || []).map(
								card => {
									let count = 1;
									if (this.props.display === "crafting") {
										count = getCollectionCardCount(
											this.props.collection,
											card.dbfId,
										);
										if (count === null) {
											count = 0;
										}
									}
									return { card, count };
								},
							)}
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
							onSortChanged={(a, b) => this.onSortChanged(a, b)}
							numCards={this.state.numCards}
							topInfoRow={topInfoMessage}
							bottomInfoRow={bottomInfomessage}
							collection={
								this.props.display === "crafting" &&
								!isCollectionDisabled()
									? this.props.collection
									: null
							}
							showEmptyCollection={
								this.props.display === "crafting"
							}
							forceCardCounts={
								this.props.display === "crafting"
									? i => +i > 0
									: false
							}
						/>
					</DataInjector>
				</div>,
			);
			if (showMoreButton && this.state.hasStatisticsData) {
				content.push(showMoreButton);
			}
		} else {
			const tiles = [];
			if (this.state.cards && this.state.cards.length) {
				this.state.filteredCards.forEach(card => {
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
				content.push(<div id="card-list">{tiles}</div>);
				if (showMoreButton) {
					content.push(showMoreButton);
				}
			} else {
				content.push(
					<TableLoading
						cardData={this.props.cardData}
						status={LoadingStatus.LOADING}
					/>,
				);
			}
		}

		let search = null;

		const filterClassNames = ["infobox full-xs"];
		const contentClassNames = ["card-list-wrapper"];
		if (!this.state.showFilters) {
			filterClassNames.push("hidden-xs");
			let clear = null;
			if (this.props.text) {
				clear = (
					<span
						className="glyphicon glyphicon-remove form-control-feedback"
						onClick={() => this.props.setText("", false)}
					/>
				);
			}
			search = (
				<div className="search-wrapper">
					<div className="form-group has-feedback">
						<input
							autoFocus
							placeholder={t("Search: Fireball, Magma Rager…")}
							type="search"
							className="form-control"
							value={this.props.text}
							onChange={x =>
								this.props.setText(x.target["value"])
							}
						/>
						<span className="glyphicon glyphicon-search form-control-feedback" />
						{clear}
					</div>
				</div>
			);
		} else {
			contentClassNames.push("hidden-xs");
		}

		const backButton = (
			<button
				className="btn btn-primary btn-full visible-xs"
				type="button"
				onClick={() => this.setState({ showFilters: false })}
			>
				{t("Back to card list")}
			</button>
		);

		return (
			<div className="cards">
				<aside
					className={filterClassNames.join(" ")}
					id="cards-infobox"
				>
					{backButton}
					{this.buildFilters()}
					{backButton}
				</aside>
				<main className={contentClassNames.join(" ")}>
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
					{search}
					{content}
				</main>
			</div>
		);
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

	filterCounts(cardFilters: CardFilters): CardFilters {
		const filters = {
			cost: {},
			format: {},
			mechanics: {},
			playerClass: {},
			race: {},
			rarity: {},
			set: {},
			type: {},
		};

		Object.keys(filters).forEach(key => {
			cardFilters[key].forEach(card => {
				if (key === "mechanics") {
					card.mechanics &&
						card.mechanics.forEach(m => {
							filters.mechanics[m] =
								(filters.mechanics[m] || 0) + 1;
						});
				} else if (key === "format") {
					if (!isWildSet(card.set)) {
						filters.format["standard"] =
							(filters.format["standard"] || 0) + 1;
					}
				} else if (key === "cost") {
					if (card.cost !== undefined) {
						const cost = "" + Math.min(card.cost, 7);
						filters.cost[cost] = (filters.cost[cost] || 0) + 1;
					}
				} else {
					const prop = card[key];
					if (prop !== undefined) {
						filters[key]["" + prop] =
							(filters[key]["" + prop] || 0) + 1;
					}
				}
			});
		});

		return filters;
	}

	resetFilters(): void {
		this.props.reset();
	}

	buildFilters(): JSX.Element[] {
		const showReset = this.props.canBeReset;
		const isStatsView = this.isStatsView();
		const { t } = this.props;

		const filters = [
			<ResetHeader
				key="reset"
				onReset={() => this.resetFilters()}
				showReset={showReset}
			>
				{this.props.personal
					? t("My Cards")
					: isStatsView
						? t("Cards")
						: t("Gallery")}
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
				</InfoboxFilterGroup>
			</section>
		);

		if (!this.props.personal) {
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
					{!isCollectionDisabled() ? (
						<InfoboxFilter value="crafting">
							{t("Crafting view")}
						</InfoboxFilter>
					) : null}
					<InfoboxFilter value="gallery">
						{t("Gallery view")}
					</InfoboxFilter>
				</InfoboxFilterGroup>,
			);
		}

		if (this.props.personal || !isStatsView) {
			filters.push(
				<Fragment key="class">
					<h2>{t("Class")}</h2>
					<ClassFilter
						filters="AllNeutral"
						hideAll
						minimal
						selectedClasses={[
							this.props.playerClass as FilterOption,
						]}
						selectionChanged={selected =>
							this.props.setPlayerClass(selected[0])
						}
					/>
				</Fragment>,
			);
		} else {
			filters.push(
				<Fragment key="class">
					<h2>{t("Deck Class")}</h2>
					<ClassFilter
						filters="All"
						hideAll
						minimal
						selectedClasses={[
							this.props.playerClass as FilterOption,
						]}
						selectionChanged={selected =>
							this.props.setPlayerClass(selected[0])
						}
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
					</InfoboxFilterGroup>
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
		}

		if (this.props.personal) {
			filters.push(modeFilter);
			filters.push(
				<InfoboxFilterGroup
					header={t("Time frame")}
					selectedValue={this.props.timeRange}
					onClick={value => this.props.setTimeRange(value)}
					key="timeframe"
				>
					<InfoboxFilter value={TimeRange.LAST_3_DAYS}>
						<PrettyTimeRange timeRange={TimeRange.LAST_3_DAYS} />
					</InfoboxFilter>
					<InfoboxFilter value={TimeRange.LAST_7_DAYS}>
						<PrettyTimeRange timeRange={TimeRange.LAST_7_DAYS} />
					</InfoboxFilter>
					<InfoboxFilter value={TimeRange.LAST_30_DAYS}>
						<PrettyTimeRange timeRange={TimeRange.LAST_30_DAYS} />
					</InfoboxFilter>
					<InfoboxFilter value={TimeRange.CURRENT_SEASON}>
						<PrettyTimeRange timeRange={TimeRange.CURRENT_SEASON} />
					</InfoboxFilter>
					<Feature feature={"current-expansion-filter"}>
						<InfoboxFilter value={TimeRange.CURRENT_EXPANSION}>
							<PrettyTimeRange
								timeRange={TimeRange.CURRENT_EXPANSION}
							/>
							<span className="infobox-value">New!</span>
						</InfoboxFilter>
					</Feature>
					<Feature feature={"current-patch-filter"}>
						<InfoboxFilter value={TimeRange.CURRENT_PATCH}>
							<PrettyTimeRange
								timeRange={TimeRange.CURRENT_PATCH}
							/>
							<span className="infobox-value">{t("New!")}</span>
						</InfoboxFilter>
					</Feature>
				</InfoboxFilterGroup>,
			);
		}

		if (isStatsView || (this.props.personal && this.props.account)) {
			const lastUpdatedUrl = isStatsView
				? "card_played_popularity_report"
				: "single_account_lo_individual_card_stats";
			const lastUpdatedParams = isStatsView
				? this.getParams()
				: this.getPersonalParams();
			filters.push(
				<Fragment key="data">
					<h2>{t("Data")}</h2>
					<ul>
						<InfoboxLastUpdated
							url={lastUpdatedUrl}
							params={lastUpdatedParams}
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
			<InfoboxFilterGroup
				key="costs"
				header={t("Cost")}
				deselectable
				className="filter-list-cost"
				selectedValue={this.props.cost}
				onClick={(newValue, cost) => this.props.toggleCost(cost)}
			>
				{this.buildCostFilters(
					this.state.filterCounts && this.state.filterCounts.cost,
				)}
			</InfoboxFilterGroup>,
			<InfoboxFilterGroup
				key="rarities"
				header={t("Rarity")}
				deselectable
				selectedValue={this.props.rarity}
				onClick={(newValue, rarity) => this.props.toggleRarity(rarity)}
			>
				{this.buildFilterItems(
					"rarity",
					this.state.filterCounts && this.state.filterCounts.rarity,
				)}
			</InfoboxFilterGroup>,
			<InfoboxFilterGroup
				key="sets"
				header={t("Set")}
				collapsed
				deselectable
				selectedValue={this.props.set}
				onClick={(newValue, set) => this.props.toggleSet(set)}
			>
				{this.buildFilterItems(
					"set",
					this.state.filterCounts && this.state.filterCounts.set,
				)}
				{this.buildFormatFilter(
					this.state.filterCounts &&
						this.state.filterCounts.format["standard"],
				)}
			</InfoboxFilterGroup>,
			<InfoboxFilterGroup
				key="types"
				header={t("Type")}
				collapsed
				deselectable
				selectedValue={this.props.type}
				onClick={(newValue, type) => this.props.toggleType(type)}
			>
				{this.buildFilterItems(
					"type",
					this.state.filterCounts && this.state.filterCounts.type,
				)}
			</InfoboxFilterGroup>,
			<InfoboxFilterGroup
				key="tribes"
				header={t("Tribe")}
				collapsed
				deselectable
				selectedValue={this.props.race}
				onClick={(newValue, race) => this.props.toggleRace(race)}
			>
				{this.buildFilterItems(
					"race",
					this.state.filterCounts && this.state.filterCounts.race,
				)}
			</InfoboxFilterGroup>,
			<InfoboxFilterGroup
				key="mechanics"
				header={t("Mechanics")}
				collapsed
				deselectable
				selectedValue={this.props.mechanics}
				onClick={(newValue, mechanic) =>
					this.props.toggleMechanics(mechanic)
				}
			>
				{this.buildFilterItems(
					"mechanics",
					this.state.filterCounts &&
						this.state.filterCounts.mechanics,
				)}
			</InfoboxFilterGroup>,
		);

		if (this.props.display === "gallery" && !this.props.personal) {
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

		return filters;
	}

	buildFilterItems(key: string, counts: any): JSX.Element[] {
		if (!counts) {
			return null;
		}
		const getText = (item: string) => {
			if (key === "set") {
				return getSetName(item.toLowerCase(), this.props.t);
			} else if (key === "mechanics") {
				return item
					.split("_")
					.map(x => toTitleCase(x))
					.join(" ");
			} else {
				return toTitleCase(item);
			}
		};

		return Cards.FILTERS[key].map(
			item =>
				getText("" + item) ? (
					<InfoboxFilter value={item} disabled={!counts[item]}>
						{getText("" + item)}
						<span className="infobox-value">
							{counts[item] || 0}
						</span>
					</InfoboxFilter>
				) : null,
		);
	}

	buildCostFilters(counts: any): JSX.Element[] {
		return (
			counts &&
			Cards.FILTERS["cost"].map(item => (
				<InfoboxFilter
					value={"" + item}
					disabled={!counts["" + item]}
					className="mana-crystal"
				>
					<img
						src={image("mana_crystal.png")}
						height={28}
						aria-hidden="true"
					/>
					<div>
						{+item < 7 ? item : "7+"}
						<span className="sr-only">{this.props.t("Mana")}</span>
					</div>
				</InfoboxFilter>
			))
		);
	}

	buildFormatFilter(count: number) {
		const selected = this.props.format === "standard";
		const classNames = ["selectable"];
		if (!count) {
			classNames.push("disabled");
		}
		if (selected) {
			classNames.push("selected");
		}

		return (
			<li
				className={classNames.join(" ")}
				onClick={() =>
					count && this.props.setFormat(selected ? null : "standard")
				}
			>
				{this.props.t("Standard only")}
				<span className="infobox-value">{count || 0}</span>
			</li>
		);
	}

	filter(card: any, excludeFilter?: string, sparseDicts?: any[]): boolean {
		if (this.props.text) {
			const cleanParts = this.props.text
				.split(",")
				.map(x => cleanText(x).trim())
				.filter(x => x.length > 0);
			const slangs = cleanParts
				.map(x => slangToCardId(x))
				.filter(x => x !== null);

			if (
				slangs.length === 0 ||
				slangs.every(slang => card.id !== slang)
			) {
				const cleanCardName = cleanText(card.name);
				if (
					cleanParts.every(part => cleanCardName.indexOf(part) === -1)
				) {
					const cleanCardtext = card.text && cleanText(card.text);
					if (
						!card.text ||
						cleanParts.every(
							part => cleanCardtext.indexOf(part) === -1,
						)
					) {
						return true;
					}
				}
			}
		}

		const isStatsView = this.isStatsView();

		if (isStatsView) {
			const exclude = this.props.exclude;
			if (exclude === "neutral" && card.cardClass === "NEUTRAL") {
				return true;
			} else if (exclude === "class" && card.cardClass !== "NEUTRAL") {
				return true;
			}
			const playerClass = this.props.playerClass;
			if (
				playerClass !== "ALL" &&
				card.multiClassGroup &&
				this.multiClassGroups[card.multiClassGroup].indexOf(
					playerClass,
				) === -1
			) {
				return true;
			}
			if (
				this.props.gameType === "RANKED_STANDARD" &&
				isWildSet(card.set)
			) {
				return true;
			}
			if (
				playerClass !== "ALL" &&
				playerClass !== card.cardClass &&
				card.cardClass !== "NEUTRAL"
			) {
				return true;
			}
		}

		if (this.props.personal && sparseDicts.length) {
			const playedOrIncluded = sparseDicts[0][card.dbfId];
			if (!playedOrIncluded) {
				return true;
			}
		}

		if (isStatsView && sparseDicts.length) {
			const included = sparseDicts[0][card.dbfId];
			const played = sparseDicts[1][card.dbfId];
			if (!included || !played || +included < 0.01 || +played < 0.01) {
				return true;
			}
		}

		let filter = false;

		Object.keys(Cards.FILTERS).forEach(key => {
			if (key === "playerClass") {
				if (isStatsView) {
					return;
				} else if (this.props["playerClass"] === card["cardClass"]) {
					return true;
				}
			} else if (key === excludeFilter) {
				return;
			}
			const values = this.props[key];
			if (!values.length) {
				return;
			}

			const available = Cards.FILTERS[key].filter(
				x => values.indexOf("" + x) !== -1,
			);
			if (!filter && available.length) {
				const cardValue = card[key];
				if (key === "format") {
					if (values.indexOf("standard") !== -1) {
						filter = isWildSet(card.set);
					}
				} else if (cardValue === undefined) {
					filter = true;
				} else if (key === "mechanics") {
					filter = available.every(
						val => cardValue.indexOf(val) === -1,
					);
				} else if (key === "cost") {
					filter = available.indexOf(Math.min(cardValue, 7)) === -1;
				} else {
					filter = available.indexOf(cardValue) === -1;
				}
			}
		});
		return filter;
	}

	getParams(): any {
		const params = {
			GameType: this.props.gameType,
			TimeRange: this.props.timeRange,
			// Region: this.props.region,
		};
		if (this.props.gameType !== "ARENA") {
			Object.assign(params, {
				RankRange: this.props.rankRange,
			});
		}
		return params;
	}

	getPersonalParams(): any {
		if (!this.props.account) {
			return {};
		}
		return {
			GameType: this.props.gameType,
			Region: this.props.account.region,
			account_lo: this.props.account.lo,
			TimeRange: this.props.timeRange,
		};
	}

	onSortChanged(sortBy, sortDirection): void {
		this.props.setSortBy(sortBy);
		this.props.setSortDirection(sortDirection);
	}

	isStatsView(): boolean {
		return !this.props.personal && this.props.display !== "gallery";
	}

	private loadPlaceholders(): void {
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

export default translate()(Cards);
