import InfoboxFilterGroup from "../components/InfoboxFilterGroup";
import React from "react";
import CardData from "../CardData";
import CardImage from "../components/CardImage";
import ClassFilter, { FilterOption } from "../components/ClassFilter";
import DataInjector from "../components/DataInjector";
import InfoboxFilter from "../components/InfoboxFilter";
import * as _ from "lodash";
import TableLoading from "../components/loading/TableLoading";
import PremiumWrapper from "../components/PremiumWrapper";
import ResetHeader from "../components/ResetHeader";
import DataManager from "../DataManager";
import {
	cardSorting,
	cleanText,
	isCollectibleCard,
	isPlayableCard,
	isWildSet,
	setNames,
	slangToCardId,
	toTitleCase,
} from "../helpers";
import InfoboxLastUpdated from "../components/InfoboxLastUpdated";
import UserData, { Account } from "../UserData";
import {
	FragmentChildProps,
	HearthstoneCollection,
	LoadingStatus,
	SortDirection,
} from "../interfaces";
import CardTable from "../components/tables/CardTable";
import Feature from "../components/Feature";
const Fragment = React.Fragment;

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

interface Props extends FragmentChildProps {
	cardData: CardData;
	personal: boolean;
	collection: HearthstoneCollection | null;
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
	setRace?: (race: string[]) => void;
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

const PLACEHOLDER_MINION = STATIC_URL + "images/loading_minion.png";
const PLACEHOLDER_SPELL = STATIC_URL + "images/loading_spell.png";
const PLACEHOLDER_WEAPON = STATIC_URL + "images/loading_weapon.png";
const PLACEHOLDER_HERO = STATIC_URL + "images/loading_hero.png";

export default class Cards extends React.Component<Props, State> {
	readonly filters = {
		cost: [0, 1, 2, 3, 4, 5, 6, 7],
		format: ["standard"],
		mechanics: [
			"ENRAGED",
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
		],
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
		timeRange: ["LAST_14_DAYS"],
	};

	private readonly allowedValuesPremium = {
		gameType: ["RANKED_STANDARD", "RANKED_WILD", "ARENA"],
		rankRange: ["LEGEND_THROUGH_TEN"],
		region: [],
		timeRange: ["LAST_1_DAY", "LAST_3_DAYS", "LAST_7_DAYS", "LAST_14_DAYS"],
	};

	showMoreButton: HTMLDivElement;

	constructor(props: Props, context: any) {
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
		this.filters.mechanics.sort();

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
		this.scrollCb = () => this.onSearchScroll();
		document.addEventListener("scroll", this.scrollCb);
	}

	public componentWillUnmount(): void {
		document.removeEventListener("scroll", this.scrollCb);
	}

	public componentDidUpdate(
		prevProps: Readonly<Props>,
		prevState: Readonly<State>,
		prevContext: any,
	): void {
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
		const filterKeys = Object.keys(this.filters);
		filterKeys.forEach(key => (filteredByProp[key] = []));
		const filteredCards = [];

		const { display, uncollectible } = this.props;
		const showUncollectible =
			display === "gallery" &&
			uncollectible === "show" &&
			!this.props.personal &&
			UserData.hasFeature("cards-uncollectible");

		const viableUncollectibleCard = card =>
			!card.collectible &&
			this.filters.set.indexOf(card.set) !== -1 &&
			card.type !== "HERO" &&
			isPlayableCard(card);

		(!this.props.showSparse
			? this.getSparseFilterDicts()
			: Promise.resolve([])
		).then(sparseDict => {
			this.state.cards.forEach(card => {
				if (
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

	public componentWillReceiveProps(
		nextProps: Readonly<Props>,
		nextContext: any,
	): void {
		if (!this.state.cards && nextProps.cardData) {
			const cards = [];
			const { set, type } = this.filters;
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
			this.setState({ cards });
		}
	}

	public componentWillUpdate(
		nextProps: Readonly<Props>,
		nextState: Readonly<State>,
		nextContext: any,
	): void {
		if (!this.props.personal && this.props.display !== nextProps.display) {
			if (nextProps.display === "gallery") {
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
	}

	public render(): React.ReactNode {
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
								customNoDataMessage={[
									<h2>All set!</h2>,
									<p>
										We've successfully linked your
										Hearthstone account{" "}
										<strong>
											{this.props.account.battletag}
										</strong>{" "}
										and will analyze incoming replays.
									</p>,
									<p>
										After you've played some games you'll
										find statistics for all the cards you
										play right here.
									</p>,
									<p className="text-muted">
										Note: It may take a few hours for new
										data to appear on this page. If you are
										missing data, make sure the filters in
										the sidebar are correct!
									</p>,
								]}
								collection={this.props.collection}
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
						<h2>Link your Hearthstone account</h2>
						<p>
							Play a game and{" "}
							<a href="/games/mine/">upload the replay</a> for
							your personal card statistics to start appearing
							here.
						</p>
						<p className="text-muted">
							Note: It may take a few hours for new data to appear
							on this page.<br />
							<a href="/contact/">
								Contact us if you keep seeing this message.
							</a>
						</p>
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
					<div className="info-row text-center text-help">
						<span className="hidden-xs hidden-sm">
							Some cards were hidden due to a low amount of
							data.&nbsp;
						</span>
						<a
							href="#"
							className="btn btn-default"
							onClick={event => {
								event.preventDefault();
								this.props.setShowSparse(true);
							}}
						>
							Show sparse data
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
								card => ({ card, count: 1 }),
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
							collection={this.props.collection}
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
							placeholder="Search: Fireball, lance, valet, ..."
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
				Back to card list
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
						Filters
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

		const filters = [
			<ResetHeader
				key="reset"
				onReset={() => this.resetFilters()}
				showReset={showReset}
			>
				{this.props.personal
					? "My Cards"
					: isStatsView ? "Cards" : "Gallery"}
			</ResetHeader>,
		];

		const modeFilter = (
			<section id="mode-filter" key="mode-filter">
				<InfoboxFilterGroup
					header="Game Mode"
					selectedValue={this.props.gameType}
					onClick={value => this.props.setGameType(value)}
				>
					<InfoboxFilter value="RANKED_STANDARD">
						Ranked Standard
					</InfoboxFilter>
					<InfoboxFilter value="RANKED_WILD">
						Ranked Wild
					</InfoboxFilter>
					<InfoboxFilter
						disabled={this.props.rankRange === "LEGEND_THROUGH_TEN"}
						value="ARENA"
					>
						Arena
					</InfoboxFilter>
				</InfoboxFilterGroup>
			</section>
		);

		if (!this.props.personal) {
			filters.push(
				<InfoboxFilterGroup
					header="Display"
					selectedValue={this.props.display}
					onClick={value => this.props.setDisplay(value)}
					key="display"
				>
					<InfoboxFilter value="statistics">
						Statistics view
					</InfoboxFilter>
					<InfoboxFilter value="gallery">Gallery view</InfoboxFilter>
				</InfoboxFilterGroup>,
			);
		}

		if (this.props.personal || !isStatsView) {
			filters.push(
				<Fragment key="class">
					<h2>Class</h2>
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
					<h2>Deck Class</h2>
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
							Class cards only
						</InfoboxFilter>
						<InfoboxFilter value="class">
							Neutral cards only
						</InfoboxFilter>
					</InfoboxFilterGroup>
					{modeFilter}
					<section>
						<InfoboxFilterGroup
							header="Time Frame"
							infoHeader="Time Framge"
							infoContent="Get the most recent data on which cards are hot right now!"
							selectedValue={this.props.timeRange}
							onClick={value => this.props.setTimeRange(value)}
						>
							<PremiumWrapper
								name="Card List Time Frame"
								iconStyle={{ display: "none" }}
							>
								<InfoboxFilter value="LAST_1_DAY">
									Last 1 day
								</InfoboxFilter>
								<InfoboxFilter value="LAST_3_DAYS">
									Last 3 days
								</InfoboxFilter>
								<InfoboxFilter value="LAST_7_DAYS">
									Last 7 days
								</InfoboxFilter>
							</PremiumWrapper>
							<InfoboxFilter value="LAST_14_DAYS">
								Last 14 days
							</InfoboxFilter>
							<Feature feature={"current-expansion-filter"}>
								<InfoboxFilter value="CURRENT_EXPANSION">
									Kobolds and Catacombs
									<span className="infobox-value">New!</span>
								</InfoboxFilter>
							</Feature>
							<Feature feature={"current-patch-filter"}>
								<InfoboxFilter value="CURRENT_PATCH">
									Patch 10.2
								</InfoboxFilter>
							</Feature>
							<Feature feature={"current-arena-event-filter"}>
								<InfoboxFilter
									value="ARENA_EVENT"
									disabled={this.props.gameType !== "ARENA"}
								>
									Wildfest
									<span className="infobox-value">New!</span>
								</InfoboxFilter>
							</Feature>
						</InfoboxFilterGroup>
					</section>
					<InfoboxFilterGroup
						header="Rank Range"
						infoHeader="Rank Range"
						infoContent="Check out which cards are played at certain rank ranges on the ranked ladder!"
						onClick={value => this.props.setRankRange(value)}
						selectedValue={
							this.props.gameType !== "ARENA" &&
							this.props.rankRange
						}
						disabled={this.props.gameType === "ARENA"}
					>
						<PremiumWrapper
							name="Card List Rank Range"
							iconStyle={{ display: "none" }}
						>
							<InfoboxFilter value="LEGEND_ONLY">
								Legend only
							</InfoboxFilter>
							<InfoboxFilter value="LEGEND_THROUGH_FIVE">
								Legend–5
							</InfoboxFilter>
							<InfoboxFilter value="LEGEND_THROUGH_TEN">
								Legend–10
							</InfoboxFilter>
						</PremiumWrapper>
						<InfoboxFilter value="ALL">Legend–25</InfoboxFilter>
					</InfoboxFilterGroup>
				</Fragment>,
			);
		}

		if (this.props.personal) {
			filters.push(modeFilter);
			filters.push(
				<InfoboxFilterGroup
					header="Time Frame"
					selectedValue={this.props.timeRange}
					onClick={value => this.props.setTimeRange(value)}
					key="timeframe"
				>
					<InfoboxFilter value="LAST_3_DAYS">
						Last 3 days
					</InfoboxFilter>
					<InfoboxFilter value="LAST_7_DAYS">
						Last 7 days
					</InfoboxFilter>
					<InfoboxFilter value="LAST_30_DAYS">
						Last 30 days
					</InfoboxFilter>
					<InfoboxFilter value="CURRENT_SEASON">
						Current Season
					</InfoboxFilter>
					<Feature feature={"current-expansion-filter"}>
						<InfoboxFilter value="CURRENT_EXPANSION">
							Kobolds and Catacombs
							<span className="infobox-value">New!</span>
						</InfoboxFilter>
					</Feature>
					<Feature feature={"current-patch-filter"}>
						<InfoboxFilter value="CURRENT_PATCH">
							Patch 10.2
							<span className="infobox-value">New!</span>
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
					<h2>Data</h2>
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
							Show sparse data
						</InfoboxFilter>
					</InfoboxFilterGroup>
				</Fragment>,
			);
		}

		filters.push(
			<InfoboxFilterGroup
				key="costs"
				header="Cost"
				deselectable
				classNames={["filter-list-cost"]}
				selectedValue={this.props.cost}
				onClick={(newValue, cost) => this.props.toggleCost(cost)}
			>
				{this.buildCostFilters(
					this.state.filterCounts && this.state.filterCounts.cost,
				)}
			</InfoboxFilterGroup>,
			<InfoboxFilterGroup
				key="rarities"
				header="Rarity"
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
				header="Set"
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
				header="Type"
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
				key="races"
				header="Race"
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
				header="Mechanics"
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

		if (
			UserData.hasFeature("cards-uncollectible") &&
			this.props.display === "gallery" &&
			!this.props.personal
		) {
			filters.push(
				<InfoboxFilterGroup
					key="uncollectible"
					header="Uncollectible"
					deselectable
					selectedValue={this.props.uncollectible}
					onClick={value => this.props.setUncollectible(value)}
				>
					<InfoboxFilter value="show">
						Show uncollectible cards
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
				return setNames[item.toLowerCase()];
			} else if (key === "mechanics") {
				return item === "ENRAGED"
					? "Enrage"
					: item
							.split("_")
							.map(x => toTitleCase(x))
							.join(" ");
			} else {
				return toTitleCase(item);
			}
		};

		return this.filters[key].map(item => (
			<InfoboxFilter value={item} disabled={!counts[item]}>
				{getText("" + item)}
				<span className="infobox-value">{counts[item] || 0}</span>
			</InfoboxFilter>
		));
	}

	buildCostFilters(counts: any): JSX.Element[] {
		return (
			counts &&
			this.filters["cost"].map(item => (
				<InfoboxFilter
					value={"" + item}
					disabled={!counts["" + item]}
					classNames={["mana-crystal"]}
				>
					<img
						src={STATIC_URL + "images/mana_crystal.png"}
						height={28}
						aria-hidden="true"
					/>
					<div>
						{+item < 7 ? item : "7+"}
						<span className="sr-only">Mana</span>
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
				Standard only
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
				card.playerClass !== "NEUTRAL"
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

		Object.keys(this.filters).forEach(key => {
			if (isStatsView && key === "playerClass") {
				return;
			}
			if (key === excludeFilter) {
				return;
			}
			const values = this.props[key];
			if (!values.length) {
				return;
			}

			const available = this.filters[key].filter(
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
		return {
			GameType: this.props.gameType,
			RankRange: this.props.rankRange,
			TimeRange: this.props.timeRange,
			// Region: this.props.region,
		};
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
}
