import React from "react";
import * as _ from "lodash";
import CardData from "../CardData";
import CardSearch from "../components/CardSearch";
import ClassFilter, { FilterOption } from "../components/ClassFilter";
import DeckList from "../components/DeckList";
import InfoboxFilter from "../components/InfoboxFilter";
import InfoboxFilterGroup from "../components/InfoboxFilterGroup";
import NoDecksMessage from "../components/NoDecksMessage";
import ResetHeader from "../components/ResetHeader";
import DataManager from "../DataManager";
import {
	cardClass,
	cardSorting,
	isCollectibleCard,
	isWildSet,
	sortCards
} from "../helpers";
import { DeckObj, FragmentChildProps, TableData } from "../interfaces";
import InfoboxLastUpdated from "../components/InfoboxLastUpdated";
import UserData from "../UserData";
import Fragments from "../components/Fragments";
import InfoIcon from "../components/InfoIcon";
import { decode as decodeDeckstring } from "deckstrings";
import { Limit } from "../components/ObjectSearch";
import Feature from "../components/Feature";

interface Props extends FragmentChildProps {
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
	account?: string;
	cardSearchExcludeKey?: number;
	cardSearchIncludeKey?: number;
	cards?: any[];
	filteredDecks: DeckObj[];
	loading?: boolean;
	showFilters?: boolean;
}

export default class MyDecks extends React.Component<Props, State> {
	private deckListsFragmentsRef;

	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			account: UserData.getDefaultAccountKey(),
			cardSearchExcludeKey: 0,
			cardSearchIncludeKey: 0,
			cards: null,
			filteredDecks: [],
			loading: true,
			showFilters: false
		};
		this.updateFilteredDecks();
	}

	public componentDidUpdate(
		prevProps: Readonly<Props>,
		prevState: Readonly<State>,
		prevContext: any
	): void {
		if (
			this.state.account !== prevState.account ||
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

	public componentWillReceiveProps(
		nextProps: Readonly<Props>,
		nextContext: any
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
						count: 1
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
						cardObj => cardObj.card.id === excludedCardObj.card.id
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
				GameType: this.props.gameType
			})
		) {
			this.setState({ loading: true });
		}

		return DataManager.get("list_decks_by_win_rate", {
			GameType: this.props.gameType
		}).then(deckData => {
			if (UserData.hasFeature("mydecks-rds-api")) {
				return DataManager.get(
					"/api/v1/analytics/decks/summary/",
					params
				).then((data: TableData) => {
					if (data && data.series) {
						Object.keys(data.series.data).forEach(shortId => {
							const deck = Object.assign(
								{},
								data.series.data[shortId]
							) as any;
							const playerClass = cardClass[deck.player_class];
							if (
								this.props.playerClasses.length &&
								this.props.playerClasses.indexOf(
									playerClass as FilterOption
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
										this.props.includedSet
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
				params
			).then((data: TableData) => {
				if (data && data.series) {
					Object.keys(data.series.data).forEach(playerClass => {
						if (
							this.props.playerClasses.length &&
							this.props.playerClasses.indexOf(
								playerClass as FilterOption
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
										this.props.includedSet
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
						winrate: deck.win_rate
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
		let content = null;
		const userAccounts = UserData.getAccounts();

		if (!userAccounts.length) {
			content = (
				<div className="message-wrapper">
					<h2>Link your Hearthstone account</h2>
					<p>
						Play a game and{" "}
						<a href="/games/mine/">upload the replay</a> for your
						deck statistics to start appearing here.
					</p>
					<p className="text-muted">
						Note: It may take a few hours for new data to appear on
						this page.<br />
						<a href="/contact/">
							Contact us if you keep seeing this message.
						</a>
					</p>
				</div>
			);
		} else if (this.state.loading) {
			content = <h3 className="message-wrapper">Loading…</h3>;
		} else if (this.state.filteredDecks.length === 0) {
			let resetButton = null;
			if (this.props.canBeReset) {
				resetButton = (
					<button
						className="btn btn-default"
						type="button"
						onClick={() => this.props.reset()}
					>
						Reset filters
					</button>
				);
				content = <NoDecksMessage>{resetButton}</NoDecksMessage>;
			} else {
				let accountDisplayName = "";
				for (let i = 0; i < userAccounts.length; i++) {
					const account = userAccounts[i];
					if (
						`${account.region}-${account.lo}` === this.state.account
					) {
						accountDisplayName = account.battletag;
						break;
					}
				}
				content = (
					<div className="message-wrapper">
						<h2>All set!</h2>
						<p>
							We've successfully linked your Hearthstone account{" "}
							<strong>{accountDisplayName}</strong> and will
							analyze incoming replays.
						</p>
						<p>
							After you've played some games you'll find
							statistics for all the decks you play right here.
						</p>
						<p className="text-muted">
							Note: It may take a few hours for new data to appear
							on this page. If you are missing data, make sure the
							filters in the sidebar are correct!
						</p>
					</div>
				);
			}
		} else {
			content = (
				<Fragments
					defaults={{
						sortBy: "lastPlayed",
						sortDirection: "descending",
						page: 1
					}}
					ref={ref => this.deckListsFragmentsRef}
				>
					<DeckList
						decks={this.state.filteredDecks}
						pageSize={12}
						hrefTab={"my-statistics"}
						helpMessage={
							"Personalized statistics are available for all decks you play after joining Premium."
						}
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

		const accounts = userAccounts.map(acc => (
			<InfoboxFilter value={acc.region + "-" + acc.lo}>
				{acc.display}
			</InfoboxFilter>
		));

		const selectedCards = (key: string) => {
			if (!this.props.cardData || !this.props[key]) {
				return undefined;
			}
			let cards = this.props[key].map(dbfId =>
				this.props.cardData.fromDbf(dbfId)
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

		return (
			<div className="decks">
				<div className={filterClassNames.join(" ")} id="decks-infobox">
					{backButton}
					<ResetHeader
						onReset={() => this.props.reset()}
						showReset={this.props.canBeReset}
					>
						My Decks
					</ResetHeader>
					<section id="player-class-filter">
						<h2>
							Player Class
							<InfoIcon
								className="pull-right"
								header="Player Class Restriction"
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
									touch:
										"Only show decks for specific classes."
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
						<h2 id="card-search-include-label">Included Cards</h2>
						<InfoboxFilterGroup
							deselectable
							selectedValue={this.props.includedSet}
							onClick={value =>
								this.props.setIncludedSet(value || "ALL")
							}
						>
							<InfoboxFilter value="UNGORO">
								Latest Expansion
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
									cards.map(card => card.dbfId)
								)
							}
							selectedCards={selectedCards("includedCards")}
							cardLimit={Limit.DOUBLE}
							onPaste={e => {
								const input = e.clipboardData.getData(
									"text/plain"
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
											this.props.cardData.fromDbf(dbfId)
										);
									}
								}
								cards.sort(sortCards);
								this.props.setIncludedCards(
									cards.map(card => card.dbfId)
								);
							}}
						/>
					</section>
					<section id="exclude-cards-filter">
						<h2 id="card-search-exclude-label">Excluded Cards</h2>
						<CardSearch
							id="card-search-exclude"
							label="card-search-exclude-label"
							key={
								"cardexclude" + this.state.cardSearchExcludeKey
							}
							availableCards={filteredCards}
							onCardsChanged={cards =>
								this.props.setExcludedCards(
									cards.map(card => card.dbfId)
								)
							}
							selectedCards={selectedCards("excludedCards")}
							cardLimit={Limit.SINGLE}
						/>
					</section>
					{accounts.length > 0 ? (
						<section id="account-filter">
							<InfoboxFilterGroup
								header="Account"
								selectedValue={this.state.account}
								onClick={account => {
									UserData.setDefaultAccount(account);
									this.setState({ account });
								}}
							>
								{accounts}
							</InfoboxFilterGroup>
						</section>
					) : null}
					<section id="game-mode-filter">
						<h2>Game Mode</h2>
						<InfoboxFilterGroup
							selectedValue={this.props.gameType}
							onClick={value => this.props.setGameType(value)}
						>
							<InfoboxFilter value="RANKED_STANDARD">
								Ranked Standard
							</InfoboxFilter>
							<InfoboxFilter value="RANKED_WILD">
								Ranked Wild
							</InfoboxFilter>
						</InfoboxFilterGroup>
					</section>
					<section id="time-frame-filter">
						<h2>
							Time Frame
							<InfoIcon
								className="pull-right"
								header="Premium Deck Tracking"
								content={
									<p>
										Personalized statistics are available
										for all decks you play after joining
										Premium.
									</p>
								}
							/>
						</h2>
						<InfoboxFilterGroup
							selectedValue={this.props.timeRange}
							onClick={value => this.props.setTimeRange(value)}
						>
							<InfoboxFilter value="PREVIOUS_SEASON">
								Previous Season
							</InfoboxFilter>
							<InfoboxFilter value="CURRENT_SEASON">
								Current Season
							</InfoboxFilter>
							<InfoboxFilter value="LAST_30_DAYS">
								Last 30 days
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
						</InfoboxFilterGroup>
					</section>
					<section id="side-bar-data">
						<h2>Data</h2>
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
						Filters
					</button>
					{content}
				</div>
			</div>
		);
	}

	getPersonalParams(): any {
		const getRegion = (account: string) => account && account.split("-")[0];
		const getLo = (account: string) => account && account.split("-")[1];
		return {
			Region: getRegion(this.state.account),
			account_lo: getLo(this.state.account),
			GameType: this.props.gameType,
			TimeRange: this.props.timeRange
		};
	}

	getDataUrl(): string {
		const hasRdsApiFeature = UserData.hasFeature("mydecks-rds-api");
		return hasRdsApiFeature
			? "/api/v1/analytics/decks/summary/"
			: "single_account_lo_decks_summary";
	}
}
