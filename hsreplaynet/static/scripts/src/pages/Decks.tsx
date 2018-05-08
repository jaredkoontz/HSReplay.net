import { decode as decodeDeckstring } from "deckstrings";
import _ from "lodash";
import React from "react";
import { InjectedTranslateProps, Trans, translate } from "react-i18next";
import CardData from "../CardData";
import DataManager from "../DataManager";
import UserData from "../UserData";
import CardSearch from "../components/CardSearch";
import ClassFilter, { FilterOption } from "../components/ClassFilter";
import DeckList from "../components/DeckList";
import Feature from "../components/Feature";
import Fragments from "../components/Fragments";
import InfoIcon from "../components/InfoIcon";
import InfoboxFilter from "../components/InfoboxFilter";
import InfoboxFilterGroup from "../components/InfoboxFilterGroup";
import InfoboxLastUpdated from "../components/InfoboxLastUpdated";
import { Limit } from "../components/ObjectSearch";
import ResetHeader from "../components/ResetHeader";
import CollectionBanner from "../components/collection/CollectionBanner";
import DustFilter from "../components/filters/DustFilter";
import PremiumWrapper from "../components/premium/PremiumWrapper";
import {
	cardSorting,
	compareDecks,
	image,
	isCollectibleCard,
	isWildSet,
	sortCards,
} from "../helpers";
import { DeckObj, FragmentChildProps } from "../interfaces";
import { CollectionEvents, DeckEvents } from "../metrics/GoogleAnalytics";
import { Collection } from "../utils/api";
import {
	getDustCostForCollection,
	isCollectionDisabled,
} from "../utils/collection";

interface Props extends InjectedTranslateProps, FragmentChildProps {
	cardData: CardData | null;
	collection: Collection | null;
	latestSet?: string;
	// fragments
	excludedCards?: string[];
	setExcludedCards?: (excludedCards: string[]) => void;
	gameType?: string;
	setGameType?: (gameType: string) => void;
	includedCards?: string[];
	setIncludedCards?: (includedCards: string[]) => void;
	maxDustCost?: -1 | number;
	setMaxDustCost?: (maxDustCost: number) => void;
	opponentClasses?: FilterOption[];
	setOpponentClasses?: (opponentClasses: FilterOption[]) => void;
	playerClasses?: FilterOption[];
	setPlayerClasses?: (playerClasses: FilterOption[]) => void;
	rankRange?: string;
	setRankRange?: (rankRange: string) => void;
	region?: string;
	setRegion?: (region: string) => void;
	timeRange?: string;
	setTimeRange?: (timeRange: string) => void;
	includedSet?: string;
	setIncludedSet?: (set: string) => void;
	archetypes?: string[];
	setArchetypes?: (archetypes: string[]) => void;
	trainingData?: string;
	setTrainingData?: (trainingData: string) => void;
	withStream?: boolean;
	setWithStream?: (withStream: boolean) => void;
	minGames?: number;
	setMinGames?: (minGames: number) => void;
}

interface State {
	availableArchetypes: string[];
	cardSearchExcludeKey: number;
	cardSearchIncludeKey: number;
	cards: any[];
	filteredDecks: DeckObj[];
	loading: boolean;
	showFilters: boolean;
}

class Decks extends React.Component<Props, State> {
	private deckListsFragmentsRef;
	private trackTimeout: number | null = null;
	private hasTrackedView: boolean;
	private readonly minGames: [number, number] = [1000, 400];

	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			availableArchetypes: [],
			cardSearchExcludeKey: 0,
			cardSearchIncludeKey: 0,
			cards: null,
			filteredDecks: [],
			loading: true,
			showFilters: false,
		};
	}

	public componentDidUpdate(
		prevProps: Readonly<Props>,
		prevState: Readonly<State>,
		prevContext: any,
	): void {
		if (
			this.props.excludedCards !== prevProps.excludedCards ||
			this.props.gameType !== prevProps.gameType ||
			this.props.includedCards !== prevProps.includedCards ||
			!_.eq(this.props.opponentClasses, prevProps.opponentClasses) ||
			!_.eq(this.props.playerClasses, prevProps.playerClasses) ||
			this.props.rankRange !== prevProps.rankRange ||
			this.props.region !== prevProps.region ||
			this.props.timeRange !== prevProps.timeRange ||
			this.props.cardData !== prevProps.cardData ||
			this.props.includedSet !== prevProps.includedSet ||
			this.props.trainingData !== prevProps.trainingData ||
			this.props.maxDustCost !== prevProps.maxDustCost ||
			this.props.withStream !== prevProps.withStream ||
			this.props.minGames !== prevProps.minGames
		) {
			this.updateFilteredDecks();
			this.deckListsFragmentsRef &&
				this.deckListsFragmentsRef.reset("page");
		}

		if (this.props.collection) {
			this.attemptTrackView();
		}

		if (
			!this.state.loading &&
			this.state.filteredDecks.length === 0 &&
			this.props.minGames > this.minGames[1]
		) {
			this.props.setMinGames(this.minGames[1]);
		}
	}

	private attemptTrackView(): void {
		if (this.hasTrackedView) {
			return;
		}

		DeckEvents.onViewDecks(
			UserData.isAuthenticated(),
			UserData.getAccounts().length,
			!!this.props.collection,
		);

		this.hasTrackedView = true;
	}

	private onChangeAccount = (): void => {
		this.scheduleTrackView();
	};

	private scheduleTrackView(): void {
		this.clearTrackTimeout();
		this.hasTrackedView = false;
		this.trackTimeout = window.setTimeout(() => {
			this.attemptTrackView();
			this.trackTimeout = null;
		}, 5000);
	}

	private clearTrackTimeout(): void {
		if (this.trackTimeout === null) {
			return;
		}
		window.clearTimeout(this.trackTimeout);
		this.trackTimeout = null;
	}

	public componentDidMount(): void {
		this.updateFilteredDecks();
		if (this.props.maxDustCost >= 0) {
			CollectionEvents.onEnableDustWidget();
		}
		this.scheduleTrackView();
		document.addEventListener(
			"hsreplaynet-select-account",
			this.onChangeAccount,
		);
	}

	public componentWillUnmount(): void {
		this.attemptTrackView();
		this.clearTrackTimeout();
		document.removeEventListener(
			"hsreplaynet-select-account",
			this.onChangeAccount,
		);
	}

	public componentWillReceiveProps(
		nextProps: Readonly<Props>,
		nextContext: any,
	): void {
		if (!this.state.cards && nextProps.cardData) {
			const cards = [];
			nextProps.cardData.all().forEach(card => {
				if (card.name && isCollectibleCard(card)) {
					cards.push(card);
				}
			});
			cards.sort(cardSorting);
			this.setState({ cards });
		}
	}

	getDeckElements(): Promise<any> {
		const deckElements = [];
		const archetypes = [];
		const playerClasses = this.props.playerClasses;
		const filteredCards = (key: string): any[] => {
			const array = this.props[key] || [];
			if (array.length === 1 && !array[0]) {
				return [];
			}
			const cards = [];
			array.forEach(dbfId => {
				const index = cards.findIndex(obj => {
					return obj.card && +obj.card.dbfId === +dbfId;
				});
				if (index !== -1) {
					cards[index].count++;
				} else {
					cards.push({
						card: this.props.cardData.fromDbf(dbfId),
						count: 1,
					});
				}
			});
			return cards;
		};
		const includedCards = filteredCards("includedCards");
		const excludedCards = filteredCards("excludedCards");
		const missingIncludedCards = (deckList: any[]) => {
			return includedCards.some(includedCardObj => {
				return (
					includedCardObj &&
					deckList.every(cardObj => {
						return (
							(cardObj &&
								cardObj.card.id !== includedCardObj.card.id) ||
							cardObj.count < includedCardObj.count
						);
					})
				);
			});
		};
		const containsExcludedCards = (deckList: any[]) => {
			return excludedCards.some(excludedCardObj => {
				return (
					excludedCardObj &&
					deckList.some(
						cardObj => cardObj.card.id === excludedCardObj.card.id,
					)
				);
			});
		};
		const cardList = (cards: [number, number][]) =>
			cards.map((c: any[]) => {
				return { card: this.props.cardData.fromDbf(c[0]), count: c[1] };
			});
		const pushDeck = (deck: any, cards: any[]) => {
			deck.cards = cards;
			deckElements.push(deck);
		};
		const params = this.getParams();
		const query = this.getQueryName();
		if (!DataManager.has(query, params)) {
			this.setState({ loading: true });
		}
		return DataManager.get(query, params)
			.then(deckData => {
				const newParams = this.getParams();
				if (
					Object.keys(params).some(
						key => params[key] !== newParams[key],
					)
				) {
					return Promise.reject("Params changed");
				}
				const data = deckData.series.data;
				return Promise.resolve(data);
			})
			.then(data => {
				if (this.props.withStream) {
					return DataManager.get(
						"/api/v1/live/streaming-now/",
						null,
					).then(streams => {
						return Promise.resolve({ data, streams });
					});
				}
				return Promise.resolve({ data, streams: null });
			})
			.then(({ data, streams }) => {
				Object.keys(data).forEach(key => {
					if (
						playerClasses.length &&
						playerClasses.indexOf(key as FilterOption) === -1
					) {
						return;
					}
					data[key].forEach(deck => {
						if (
							deck.archetype_id &&
							archetypes.every(
								a => a.id !== "" + deck.archetype_id,
							)
						) {
							archetypes.push({
								id: "" + deck.archetype_id,
								playerClass: key,
							});
						}
						if (
							this.props.archetypes.length &&
							this.props.archetypes.indexOf(
								"" + deck.archetype_id,
							) === -1
						) {
							return;
						}
						const minGames =
							this.props.gameType === "RANKED_WILD"
								? this.props.minGames / 2
								: this.props.minGames;
						if (deck.total_games < minGames) {
							return;
						}
						const rawCards = JSON.parse(deck.deck_list || "");
						const cards = cardList(rawCards);
						if (
							missingIncludedCards(cards) ||
							containsExcludedCards(cards)
						) {
							return;
						}
						if (this.props.gameType === "RANKED_STANDARD") {
							if (cards.some(card => isWildSet(card.card.set))) {
								return;
							}
						}
						if (
							this.props.includedSet !== "ALL" &&
							cards.every(
								cardObj =>
									cardObj.card.set !==
										this.props.includedSet ||
									cardObj.card.dbfId === 45988, // "Marin the Fox" was released outside the expansion
							)
						) {
							return;
						}
						if (streams !== null) {
							const flatList = [];
							for (let i = 0; i < rawCards.length; i++) {
								for (let j = 0; j < rawCards[i][1]; j++) {
									flatList.push(rawCards[i][0]);
								}
							}
							let matchesAtLeastOne = false;
							for (const stream of streams) {
								if (compareDecks(stream.deck, flatList)) {
									matchesAtLeastOne = true;
									break;
								}
							}
							if (!matchesAtLeastOne) {
								return;
							}
						}

						if (
							this.props.collection &&
							this.props.maxDustCost >= 0
						) {
							if (
								getDustCostForCollection(
									this.props.collection,
									cards,
								) > this.props.maxDustCost
							) {
								return;
							}
						}

						deck.player_class = key;
						pushDeck(deck, cards);
					});
				});

				return Promise.resolve({ archetypes, deckElements });
			});
	}

	updateFilteredDecks(): void {
		if (!this.props.cardData) {
			return;
		}
		this.getDeckElements()
			.then(data => {
				const decks: DeckObj[] = [];
				data.deckElements.forEach(deck => {
					let winrate = deck.win_rate;
					let numGames = deck.total_games;
					const opponents = this.props.opponentClasses;
					if (opponents && opponents.length) {
						numGames = opponents.reduce(
							(x: number, playerClass: FilterOption) => {
								return (
									x + deck[`total_games_vs_${playerClass}`]
								);
							},
							0,
						);
						winrate =
							opponents
								.map(
									playerClass =>
										[
											deck[
												`total_games_vs_${playerClass}`
											],
											deck[`win_rate_vs_${playerClass}`],
										],
								)
								.reduce((a: number, b) => a + b[0] * b[1], 0) /
							numGames;
					}
					decks.push({
						archetypeId: deck.archetype_id,
						cards: deck.cards,
						deckId: deck.deck_id,
						duration: deck.avg_game_length_seconds,
						numGames,
						hasGlobalData: deck.hasGlobalData,
						playerClass: deck.player_class,
						winrate,
					});
				});
				this.setState({
					availableArchetypes: data.archetypes,
					filteredDecks: decks,
					loading: false,
				});
			})
			.catch(reason => {
				if (reason !== "Params changed" && reason !== 202) {
					console.error(reason);
				}
			});
	}

	public render(): React.ReactNode {
		const { t } = this.props;
		let content = null;
		if (this.state.loading) {
			content = (
				<h3 className="message-wrapper" aria-busy="true">
					{t("Loading…")}
				</h3>
			);
		} else if (this.state.filteredDecks.length === 0) {
			content = (
				<div className="content-message">
					<h2>{t("No decks found")}</h2>
					<button
						className="btn btn-default"
						type="button"
						onClick={() => this.props.reset()}
					>
						{t("Reset filters")}
					</button>
				</div>
			);
		} else {
			const curMinGames = this.getMinGames()[
				+(this.props.minGames < this.minGames[0])
			];
			const deckTypes =
				this.props.gameType === "RANKED_WILD"
					? t("Wild decks")
					: t("Standard decks");
			const onClickHelpMessage = e => {
				e.preventDefault();
				const minGames = this.minGames[
					+(this.props.minGames >= this.minGames[0])
				];
				this.props.setMinGames(minGames);
			};
			const helpMessage =
				// prettier-ignore
				<Trans>
					Showing {{deckTypes}} with at least 10 unique pilots
					and <a href="#" id="min-games-switch" onClick={onClickHelpMessage}>{{curMinGames}}</a> recorded
					games.
				</Trans>;
			content = (
				<Fragments
					defaults={{
						sortBy: "popularity",
						sortDirection: "descending",
						page: 1,
					}}
					ref={ref => this.deckListsFragmentsRef}
				>
					<DeckList
						decks={this.state.filteredDecks}
						pageSize={12}
						helpMessage={helpMessage}
						collection={this.props.collection}
					>
						{!isCollectionDisabled() ? (
							<CollectionBanner
								hasCollection={!!this.props.collection}
								wrapper={body => (
									<li
										style={{
											backgroundImage: `url('${image(
												"feature-promotional/collection-syncing-decks.png",
											)}')`,
										}}
										className="deck-list-banner hidden-xs"
									>
										{body}
									</li>
								)}
							>
								{authenticated => (
									<>
										<img src={image("logo.png")} />
										{authenticated ? (
											<>
												<span className="hidden-lg">
													{t(
														"Upload your collection!",
													)}
												</span>
												<span className="visible-lg">
													{t(
														"Upload your collection and find the decks you can build!",
													)}
												</span>
											</>
										) : (
											<>
												<span className="hidden-lg">
													{t(
														"Sign in to upload your collection!",
													)}
												</span>
												<span className="visible-lg">
													{t(
														"Sign in to find the decks you can build with your collection!",
													)}
												</span>
											</>
										)}
									</>
								)}
							</CollectionBanner>
						) : null}
					</DeckList>
				</Fragments>
			);
		}

		const filterClassNames = ["infobox full-sm"];
		const contentClassNames = ["deck-list-wrapper"];
		if (!this.state.showFilters) {
			filterClassNames.push("hidden-xs hidden-sm");
		} else {
			contentClassNames.push("hidden-xs hidden-sm");
		}

		const backButton = (
			<button
				className="btn btn-primary btn-full visible-sm visible-xs"
				type="button"
				onClick={() => this.setState({ showFilters: false })}
			>
				{t("Back to deck list")}
			</button>
		);

		const selectedCards = (key: string) => {
			if (!this.props.cardData || !this.props[key]) {
				return undefined;
			}
			let cards = this.props[key].map(dbfId =>
				this.props.cardData.fromDbf(dbfId),
			);
			cards = cards.filter(card => !!card);
			return cards;
		};

		let filteredCards = Array.isArray(this.state.cards)
			? this.state.cards
			: [];
		const gameType = this.props.gameType;
		if (gameType.endsWith("_STANDARD")) {
			filteredCards = filteredCards.filter(card => !isWildSet(card.set));
		}
		const playerClasses = this.props.playerClasses;
		if (playerClasses.length) {
			filteredCards = filteredCards.filter(card => {
				const cardClass = card.cardClass;
				return (
					cardClass === "NEUTRAL" ||
					playerClasses.indexOf(cardClass) !== -1
				);
			});
		}

		const isPremium = !!UserData.isPremium();
		const premiumTabIndex = isPremium ? 0 : -1;

		return (
			<div className="decks">
				<div className={filterClassNames.join(" ")} id="decks-infobox">
					{backButton}
					<ResetHeader
						onReset={() => this.props.reset()}
						showReset={this.props.canBeReset}
					>
						Decks
					</ResetHeader>
					<section id="player-class-filter">
						<h2>
							{t("Player class")}
							<InfoIcon
								className="pull-right"
								header={t("Player class restriction")}
								content={{
									click: (
										<p>
											{t(
												"Only show decks for specific classes.",
											)}
											&nbsp;
											<span>
												{t(
													"Hold CTRL to select multiple classes.",
												)}
											</span>
										</p>
									),
									touch: t(
										"Only show decks for specific classes.",
									),
								}}
							/>
						</h2>
						<ClassFilter
							filters="All"
							hideAll
							minimal
							multiSelect
							selectedClasses={this.props.playerClasses}
							selectionChanged={selected =>
								this.props.setPlayerClasses(selected)
							}
							archetypes={this.state.availableArchetypes}
							selectedArchetypes={this.props.archetypes}
							archetypesChanged={archetypes =>
								this.props.setArchetypes(archetypes)
							}
						/>
					</section>
					<section id="opponent-class-filter">
						<PremiumWrapper
							analyticsLabel="Deck List Opponent Selection"
							infoHeader={t("Winrate by opponent")}
							infoContent={
								<p>
									{t(
										"See how various decks perform against a specific class at a glance!",
									)}
								</p>
							}
						>
							<h2>{t("Opponent class")}</h2>
							<ClassFilter
								filters="All"
								hideAll
								minimal
								multiSelect
								tabIndex={premiumTabIndex}
								selectedClasses={this.props.opponentClasses}
								selectionChanged={selected =>
									this.props.setOpponentClasses(selected)
								}
							/>
						</PremiumWrapper>
					</section>
					<section id="max-dust-filter">
						<h2>
							{t("My collection")}
							<InfoIcon
								className="pull-right"
								header={t("Maximum dust filter")}
								content={t(
									"See which decks you can build right now without spending any or some dust.",
								)}
							/>
						</h2>
						{this.props.collection ? (
							<>
								<InfoboxFilterGroup
									deselectable
									selectedValue={
										this.props.maxDustCost < 0
											? null
											: "DUST_FILTER"
									}
									onClick={value => {
										if (value) {
											CollectionEvents.onEnableDustWidget();
										}
										this.props.setMaxDustCost(
											value ? 0 : -1,
										);
									}}
								>
									<InfoboxFilter value="DUST_FILTER">
										{t("Limit to my collection")}
									</InfoboxFilter>
								</InfoboxFilterGroup>
								{this.props.maxDustCost < 0 ? null : (
									<DustFilter
										dust={this.props.maxDustCost}
										setDust={(dust: number) =>
											this.props.setMaxDustCost(
												dust === Infinity ? -1 : dust,
											)
										}
										ownedDust={this.props.collection.dust}
									/>
								)}
							</>
						) : (
							<CollectionBanner
								hasCollection={!!this.props.collection}
								wrapper={body => (
									<div
										className="infobox-banner"
										style={{
											backgroundImage: `url('${image(
												"feature-promotional/collection-syncing-sidebar.png",
											)}')`,
										}}
									>
										{body}
									</div>
								)}
							>
								{authenticated =>
									authenticated ? (
										isCollectionDisabled() ? (
											<>
												{t(
													"Find the decks you can build",
												)}
											</>
										) : (
											<>
												{t(
													"Want to find decks you can build with your collection?",
												)}
											</>
										)
									) : (
										<>
											{t(
												"Sign in to find decks for your collection",
											)}
										</>
									)
								}
							</CollectionBanner>
						)}
					</section>
					<section id="time-frame-filter">
						<InfoboxFilterGroup
							header={t("Time frame")}
							infoHeader={t("Time frame")}
							infoContent={t(
								"Want to see which decks are hot right now? Look at data from a time frame of your choosing!",
							)}
							selectedValue={this.props.timeRange}
							onClick={value => this.props.setTimeRange(value)}
						>
							<PremiumWrapper
								analyticsLabel="Deck List Time Frame"
								iconStyle={{ display: "none" }}
							>
								<InfoboxFilter value="CURRENT_SEASON">
									{t("Current Season")}
								</InfoboxFilter>
								<InfoboxFilter value="LAST_3_DAYS">
									{t("Last {{n}} days", { n: 3 })}
								</InfoboxFilter>
								<InfoboxFilter value="LAST_7_DAYS">
									{t("Last {{n}} days", { n: 7 })}
								</InfoboxFilter>
							</PremiumWrapper>
							<InfoboxFilter value="LAST_30_DAYS">
								{t("Last {{n}} days", { n: 30 })}
							</InfoboxFilter>
							<Feature feature={"current-expansion-filter"}>
								<InfoboxFilter value="CURRENT_EXPANSION">
									{t("The Witchwood")}
									<span className="infobox-value">
										{t("New!")}
									</span>
								</InfoboxFilter>
							</Feature>
							<Feature feature={"current-patch-filter"}>
								<InfoboxFilter value="CURRENT_PATCH">
									{t("Latest patch")}
								</InfoboxFilter>
							</Feature>
						</InfoboxFilterGroup>
					</section>
					<section id="rank-range-filter">
						<InfoboxFilterGroup
							header={t("Rank range")}
							infoHeader={t("Rank range")}
							infoContent={t(
								"Ready to climb the ladder? Check out how decks perform at certain rank ranges!",
							)}
							selectedValue={this.props.rankRange}
							onClick={value => this.props.setRankRange(value)}
						>
							<PremiumWrapper
								analyticsLabel="Deck List Rank Range"
								iconStyle={{ display: "none" }}
							>
								<InfoboxFilter value="LEGEND_ONLY">
									{t("Legend only")}
								</InfoboxFilter>
								<InfoboxFilter value="LEGEND_THROUGH_FIVE">
									{t("{{rankMin}}–{{rankMax}}", {
										rankMin: t("Legend"),
										rankMax: 5,
									})}
								</InfoboxFilter>
								<InfoboxFilter value="LEGEND_THROUGH_TEN">
									{t("{{rankMin}}–{{rankMax}}", {
										rankMin: t("Legend"),
										rankMax: 10,
									})}
								</InfoboxFilter>
							</PremiumWrapper>
							<InfoboxFilter value="ALL">
								{t("{{rankMin}}–{{rankMax}}", {
									rankMin: t("Legend"),
									rankMax: 25,
								})}
							</InfoboxFilter>
						</InfoboxFilterGroup>
					</section>
					<Feature feature="deck-region-filter">
						<section id="region-filter">
							<InfoboxFilterGroup
								header={t("Region")}
								selectedValue={this.props.region}
								onClick={region => this.props.setRegion(region)}
								infoHeader={t("Region")}
								infoContent={t(
									"Want to get more specific? Take a look at the decks played in your region!",
								)}
							>
								<PremiumWrapper
									analyticsLabel="Deck List Region"
									iconStyle={{ display: "none" }}
								>
									<InfoboxFilter value="REGION_US">
										{t("Americas")}
									</InfoboxFilter>
									<InfoboxFilter value="REGION_EU">
										{t("Europe")}
									</InfoboxFilter>
									<InfoboxFilter value="REGION_KR">
										{t("Asia")}
									</InfoboxFilter>
									<Feature feature="region-filter-china">
										<InfoboxFilter value="REGION_CN">
											{t("China")}
										</InfoboxFilter>
									</Feature>
								</PremiumWrapper>
								<InfoboxFilter value="ALL">
									{t("All regions")}
								</InfoboxFilter>
							</InfoboxFilterGroup>
						</section>
					</Feature>
					<section id="game-mode-filter">
						<h2>{t("Game mode")}</h2>
						<InfoboxFilterGroup
							selectedValue={this.props.gameType}
							onClick={value => this.props.setGameType(value)}
						>
							<InfoboxFilter value="RANKED_STANDARD">
								{t("Ranked Standard")}
							</InfoboxFilter>
							<InfoboxFilter value="RANKED_WILD">
								{t("Ranked Wild")}
							</InfoboxFilter>
						</InfoboxFilterGroup>
					</section>
					<section id="include-cards-filter">
						<h2 id="card-search-include-label">
							{t("Included cards")}
						</h2>
						<Feature feature="new-card-filter">
							<InfoboxFilterGroup
								deselectable
								selectedValue={this.props.includedSet}
								onClick={value =>
									this.props.setIncludedSet(value || "ALL")
								}
							>
								<InfoboxFilter value={this.props.latestSet}>
									{t("Any new card")}
								</InfoboxFilter>
							</InfoboxFilterGroup>
						</Feature>
						<CardSearch
							id="card-search-include"
							label="card-search-include-label"
							key={
								"cardinclude" + this.state.cardSearchIncludeKey
							}
							availableCards={filteredCards}
							onCardsChanged={cards =>
								this.props.setIncludedCards(
									cards.map(card => card.dbfId),
								)
							}
							selectedCards={selectedCards("includedCards")}
							cardLimit={Limit.DOUBLE}
							onPaste={e => {
								if (!this.props.cardData) {
									return;
								}
								const input = e.clipboardData.getData(
									"text/plain",
								);
								const lines = input
									.trim()
									.split("\n")
									.filter(line => !line.startsWith("#"));
								let result = null;
								try {
									result = decodeDeckstring(lines[0]);
								} catch (e) {
									return;
								}
								e.preventDefault();
								const cards = [];
								for (const tuple of result.cards) {
									const [dbfId, count] = tuple;
									for (let i = 0; i < count; i++) {
										cards.push(
											this.props.cardData.fromDbf(dbfId),
										);
									}
								}
								cards.sort(sortCards);
								this.props.setIncludedCards(
									cards.map(card => card.dbfId),
								);
							}}
						/>
					</section>
					<section id="exclude-cards-filter">
						<h2 id="card-search-exclude-label">
							{t("Excluded Cards")}
						</h2>
						<CardSearch
							id="card-search-exclude"
							label="card-search-exclude-label"
							key={
								"cardexclude" + this.state.cardSearchExcludeKey
							}
							availableCards={filteredCards}
							onCardsChanged={cards =>
								this.props.setExcludedCards(
									cards.map(card => card.dbfId),
								)
							}
							selectedCards={selectedCards("excludedCards")}
							cardLimit={Limit.SINGLE}
						/>
					</section>
					<section id="stream-filter">
						<InfoboxFilterGroup
							header={t("Community")}
							deselectable
							selectedValue={
								this.props.withStream ? "WITH_STREAM" : null
							}
							onClick={value =>
								this.props.setWithStream(!this.props.withStream)
							}
						>
							<InfoboxFilter value="WITH_STREAM">
								{t("Stream available")}
							</InfoboxFilter>
						</InfoboxFilterGroup>
					</section>
					<section id="side-bar-data">
						<h2>{t("Data")}</h2>
						<InfoboxFilterGroup
							deselectable
							selectedValue={
								this.props.minGames >= this.minGames[0]
									? "MIN_GAMES"
									: null
							}
							onClick={value => {
								const minGames = this.minGames[
									+(this.props.minGames >= this.minGames[0])
								];
								this.props.setMinGames(minGames);
							}}
						>
							<InfoboxFilter value="MIN_GAMES">
								{t("At least {{minGames}} games", {
									minGames: this.getMinGames()[0],
								})}
							</InfoboxFilter>
						</InfoboxFilterGroup>
						<ul>
							<InfoboxLastUpdated
								url={this.getQueryName()}
								params={this.getParams()}
							/>
						</ul>
					</section>
					{backButton}
				</div>
				<div className={contentClassNames.join(" ")}>
					<button
						className="btn btn-default pull-left visible-xs visible-sm"
						type="button"
						onClick={() => this.setState({ showFilters: true })}
					>
						<span className="glyphicon glyphicon-filter" />
						{t("Filters")}
					</button>
					{content}
				</div>
			</div>
		);
	}

	getMinGames(): [number, number] {
		const isWild = this.props.gameType === "RANKED_WILD";
		return [
			isWild ? this.minGames[0] / 2 : this.minGames[0],
			isWild ? this.minGames[1] / 2 : this.minGames[1],
		];
	}

	getQueryName(): string {
		return UserData.isPremium()
			? "list_decks_by_opponent_win_rate"
			: "list_decks_by_win_rate";
	}

	getParams(): any {
		return {
			GameType: this.props.gameType,
			RankRange: this.props.rankRange,
			Region: UserData.hasFeature("deck-region-filter")
				? this.props.region
				: "ALL",
			TimeRange: this.props.timeRange,
		};
	}
}
export default translate()(Decks);
