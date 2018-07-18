import { decode as decodeDeckstring } from "deckstrings";
import _ from "lodash";
import React from "react";
import { InjectedTranslateProps, Trans, translate } from "react-i18next";
import CardData from "../CardData";
import DataManager from "../DataManager";
import UserData, { Account } from "../UserData";
import CardSearch from "../components/CardSearch";
import ClassFilter, { FilterOption } from "../components/ClassFilter";
import DeckList from "../components/DeckList";
import Feature from "../components/Feature";
import Fragments from "../components/Fragments";
import InfoIcon from "../components/InfoIcon";
import InfoboxFilter from "../components/InfoboxFilter";
import InfoboxFilterGroup from "../components/InfoboxFilterGroup";
import InfoboxLastUpdated from "../components/InfoboxLastUpdated";
import NoDecksMessage from "../components/NoDecksMessage";
import { Limit } from "../components/ObjectSearch";
import ResetHeader from "../components/ResetHeader";
import PrettyTimeRange from "../components/text/PrettyTimeRange";
import { TimeRange } from "../filters";
import {
	cardSorting,
	getCardClassName,
	image,
	isCollectibleCard,
	isWildSet,
	sortCards,
} from "../helpers";
import { DeckObj, FragmentChildProps, TableData } from "../interfaces";
import LoadingSpinner from "../components/LoadingSpinner";
import AllSet from "../components/onboarding/AllSet";
import ConnectAccount from "../components/onboarding/ConnectAccount";

interface Props extends FragmentChildProps, InjectedTranslateProps {
	account: Account | null;
	cardData: CardData;
	excludedCards?: string[];
	setExcludedCards?: (excludedCards: string[]) => void;
	gameType?: string;
	setGameType?: (gameType: string) => void;
	includedCards?: string[];
	setIncludedCards?: (includedCards: string[]) => void;
	playerClasses?: FilterOption[];
	setPlayerClasses?: (playerClasses: FilterOption[]) => void;
	includedSet?: string;
	setIncludedSet?: (set: string) => void;
	timeRange?: string;
	setTimeRange?: (timeRange: string) => void;
}

interface State {
	cardSearchExcludeKey: number;
	cardSearchIncludeKey: number;
	cards: any[];
	filteredDecks: DeckObj[];
	loading: boolean;
	showFilters: boolean;
}

class MyDecks extends React.Component<Props, State> {
	private deckListsFragmentsRef;

	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			cardSearchExcludeKey: 0,
			cardSearchIncludeKey: 0,
			cards: null,
			filteredDecks: [],
			loading: true,
			showFilters: false,
		};
	}

	public componentDidMount(): void {
		this.updateFilteredDecks();
	}

	public componentDidUpdate(
		prevProps: Readonly<Props>,
		prevState: Readonly<State>,
		prevContext: any,
	): void {
		if (
			this.props.account !== prevProps.account ||
			this.props.excludedCards !== prevProps.excludedCards ||
			this.props.gameType !== prevProps.gameType ||
			this.props.includedCards !== prevProps.includedCards ||
			!_.eq(this.props.playerClasses, prevProps.playerClasses) ||
			this.props.cardData !== prevProps.cardData ||
			this.props.includedSet !== prevProps.includedSet ||
			this.props.timeRange !== prevProps.timeRange
		) {
			this.updateFilteredDecks();
			this.deckListsFragmentsRef &&
				this.deckListsFragmentsRef.reset("page");
		}
	}

	static getDerivedStateFromProps(
		nextProps: Readonly<Props>,
		prevState: State,
	): Partial<State> | null {
		if (!prevState.cards && nextProps.cardData) {
			const cards = [];
			nextProps.cardData.all().forEach(card => {
				if (card.name && isCollectibleCard(card)) {
					cards.push(card);
				}
			});
			cards.sort(cardSorting);
			return { cards };
		}
		return null;
	}

	getDeckElements(): Promise<any[]> {
		const deckElements = [];
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
		const cardList = cards =>
			cards.map((c: any[]) => {
				return { card: this.props.cardData.fromDbf(c[0]), count: c[1] };
			});
		const pushDeck = (deck: any, cards: any[]) => {
			deck.cards = cards;
			deckElements.push(deck);
		};

		const params = this.getPersonalParams();

		if (
			!DataManager.has(this.getDataUrl(), params) ||
			!DataManager.has("list_decks_by_win_rate", {
				GameType: this.props.gameType,
			})
		) {
			this.setState({ loading: true });
		}

		return DataManager.get("list_decks_by_win_rate", {
			GameType: this.props.gameType,
		}).then(deckData => {
			if (UserData.hasFeature("mydecks-rds-api")) {
				return DataManager.get(
					"/api/v1/analytics/decks/summary/",
					params,
				).then((data: TableData) => {
					if (data && data.series) {
						Object.keys(data.series.data).forEach(shortId => {
							const deck = Object.assign(
								{},
								data.series.data[shortId],
							) as any;
							const playerClass = getCardClassName(
								deck.player_class,
							);
							if (
								this.props.playerClasses.length &&
								this.props.playerClasses.indexOf(
									playerClass as FilterOption,
								) === -1
							) {
								return;
							}
							const cards = cardList(deck.deck_list);
							if (
								missingIncludedCards(cards) ||
								containsExcludedCards(cards)
							) {
								return;
							}
							if (
								this.props.includedSet !== "ALL" &&
								cards.every(
									cardObj =>
										cardObj.card.set !==
										this.props.includedSet,
								)
							) {
								return;
							}
							deck.player_class = playerClass;
							deck.deck_id = shortId;
							const globalDeck = deckData.series.data[
								playerClass
							].find(d => d.deck_id === deck.deck_id);
							deck.hasGlobalData = !!globalDeck;
							deck.archetype_id =
								deck.archetype_id ||
								(globalDeck && globalDeck.archetype_id);
							pushDeck(deck, cards);
						});
					}
					return deckElements;
				});
			}
			return DataManager.get(
				"single_account_lo_decks_summary",
				params,
			).then((data: TableData) => {
				if (data && data.series) {
					Object.keys(data.series.data).forEach(playerClass => {
						if (
							this.props.playerClasses.length &&
							this.props.playerClasses.indexOf(
								playerClass as FilterOption,
							) === -1
						) {
							return;
						}
						data.series.data[playerClass].forEach(deck => {
							const cards = cardList(JSON.parse(deck.deck_list));
							if (
								missingIncludedCards(cards) ||
								containsExcludedCards(cards)
							) {
								return;
							}
							if (
								this.props.includedSet !== "ALL" &&
								cards.every(
									cardObj =>
										cardObj.card.set !==
										this.props.includedSet,
								)
							) {
								return;
							}
							deck.player_class = playerClass;
							const globalDeck = deckData.series.data[
								playerClass
							].find(d => d.deck_id === deck.deck_id);
							deck.hasGlobalData = !!globalDeck;
							deck.archetype_id =
								deck.archetype_id ||
								(globalDeck && globalDeck.archetype_id);
							pushDeck(deck, cards);
						});
					});
				}
				return deckElements;
			});
		});
	}

	updateFilteredDecks(): void {
		if (!this.props.cardData) {
			return;
		}
		this.getDeckElements()
			.then(deckElements => {
				const decks: DeckObj[] = deckElements.map(deck => {
					return {
						archetypeId: deck.archetype_id,
						cards: deck.cards,
						deckId: deck.deck_id,
						duration: deck.avg_game_length_seconds,
						lastPlayed:
							deck.last_played && new Date(deck.last_played),
						hasGlobalData: deck.hasGlobalData,
						numGames: deck.total_games,
						playerClass: deck.player_class,
						winrate: deck.win_rate,
					};
				});
				this.setState({ filteredDecks: decks, loading: false });
			})
			.catch(reason => {
				if (reason !== "Params changed") {
					this.setState({ filteredDecks: [], loading: false });
				}
			});
	}

	public render(): React.ReactNode {
		const { t } = this.props;

		if (!UserData.isPremium()) {
			return (
				<div className="premium-promo">
					<div className="premium-background">
						<img
							src={image("premium-promotional/mydecks_full.png")}
						/>
					</div>
					<div className="card">
						<div className="container text-center">
							<h2>
								<Trans>
									<span className="text-premium">
										Premium
									</span>{" "}
									only
								</Trans>
							</h2>
							<p className="big">
								{t(
									"View statistics for the decks you've played across your replays right here.",
								)}
							</p>
							<p>
								<a href="/premium" className="promo-button">
									{t("Learn more")}
								</a>
							</p>
						</div>
					</div>
				</div>
			);
		}

		let content = null;
		const userAccounts = UserData.getAccounts();

		if (!userAccounts.length) {
			content = (
				<div className="message-wrapper">
					<ConnectAccount
						feature={t("personalized deck statistics")}
					/>
				</div>
			);
		} else if (this.state.loading) {
			content = (
				<h3 className="message-wrapper">{<LoadingSpinner active />}</h3>
			);
		} else if (this.state.filteredDecks.length === 0) {
			let resetButton = null;
			if (this.props.canBeReset) {
				resetButton = (
					<button
						className="btn btn-default"
						type="button"
						onClick={() => this.props.reset()}
					>
						{t("Reset filters")}
					</button>
				);
				content = <NoDecksMessage>{resetButton}</NoDecksMessage>;
			} else {
				content = (
					<div className="message-wrapper">
						<AllSet
							account={this.props.account}
							feature={t("personalized deck statistics")}
						/>
					</div>
				);
			}
		} else {
			content = (
				<Fragments
					defaults={{
						sortBy: "lastPlayed",
						sortDirection: "descending",
						page: 1,
					}}
					ref={ref => (this.deckListsFragmentsRef = ref)}
				>
					<DeckList
						decks={this.state.filteredDecks}
						pageSize={12}
						hrefTab={"my-statistics"}
						helpMessage={t(
							"Personalized statistics are available for all decks you play after joining Premium.",
						)}
						lastPlayedColumn
						showGlobalDataNotice
					/>
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
				Back to my decks
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
				return (
					card.cardClass === "NEUTRAL" ||
					playerClasses.indexOf(card.cardClass) !== -1
				);
			});
		}

		return (
			<div className="decks">
				<div className={filterClassNames.join(" ")} id="decks-infobox">
					{backButton}
					<ResetHeader
						onReset={() => this.props.reset()}
						showReset={this.props.canBeReset}
					>
						{t("My decks")}
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
											Only show decks for specific
											classes.&nbsp;
											<span>
												Hold <kbd>Ctrl</kbd> to select
												multiple classes.
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
						/>
					</section>
					<section id="include-cards-filter">
						<h2 id="card-search-include-label">
							{t("Included cards")}
						</h2>
						<InfoboxFilterGroup
							deselectable
							selectedValue={this.props.includedSet}
							onClick={value =>
								this.props.setIncludedSet(value || "ALL")
							}
						>
							<InfoboxFilter value="UNGORO">
								{t("Latest expansion")}
							</InfoboxFilter>
						</InfoboxFilterGroup>
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
							{t("Excluded cards")}
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
					<section id="time-frame-filter">
						<h2>
							{t("Time frame")}
							<InfoIcon
								className="pull-right"
								header={t("Premium deck tracking")}
								content={
									<p>
										{t(
											"Personalized statistics are available for all decks you play after subscribing to HSReplay.net Premium.",
										)}
									</p>
								}
							/>
						</h2>
						<InfoboxFilterGroup
							selectedValue={this.props.timeRange}
							onClick={value => this.props.setTimeRange(value)}
						>
							<InfoboxFilter value={TimeRange.PREVIOUS_SEASON}>
								<PrettyTimeRange
									timeRange={TimeRange.PREVIOUS_SEASON}
								/>
							</InfoboxFilter>
							<InfoboxFilter value={TimeRange.CURRENT_SEASON}>
								<PrettyTimeRange
									timeRange={TimeRange.CURRENT_SEASON}
								/>
							</InfoboxFilter>
							<InfoboxFilter value={TimeRange.LAST_30_DAYS}>
								<PrettyTimeRange
									timeRange={TimeRange.LAST_30_DAYS}
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
						</InfoboxFilterGroup>
					</section>
					<section id="side-bar-data">
						<h2>{t("Data")}</h2>
						<ul>
							<InfoboxLastUpdated
								url={this.getDataUrl()}
								params={this.getPersonalParams()}
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

	getPersonalParams(): any {
		if (!this.props.account) {
			return {};
		}
		return {
			Region: this.props.account.region,
			account_lo: this.props.account.lo,
			GameType: this.props.gameType,
			TimeRange: this.props.timeRange,
		};
	}

	getDataUrl(): string {
		const hasRdsApiFeature = UserData.hasFeature("mydecks-rds-api");
		return hasRdsApiFeature
			? "/api/v1/analytics/decks/summary/"
			: "single_account_lo_decks_summary";
	}
}

export default translate()(MyDecks);
