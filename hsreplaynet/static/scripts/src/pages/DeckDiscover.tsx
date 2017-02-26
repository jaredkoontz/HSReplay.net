import * as React from "react";
import CardSearch from "../components/CardSearch";
import ClassFilter, {FilterOption} from "../components/ClassFilter";
import DeckList from "../components/DeckList";
import InfoboxFilter from "../components/InfoboxFilter";
import InfoboxFilterGroup from "../components/InfoboxFilterGroup";
import Pager from "../components/Pager";
import PremiumWrapper from "../components/PremiumWrapper";
import QueryManager from "../QueryManager";
import ResetHeader from "../components/ResetHeader";
import {DeckObj, TableData, GameMode, RankRange, Region, TimeFrame} from "../interfaces";
import {cardSorting, toTitleCase} from "../helpers";
import {
	QueryMap, getQueryMapArray, getQueryMapFromLocation, queryMapHasChanges,
	setLocationQueryString, setQueryMap, toQueryString
} from "../QueryParser"

interface MyDecks {
	[deckId: number]: any;
}

interface DeckDiscoverState {
	cardSearchExcludeKey?: number;
	cardSearchIncludeKey?: number;
	cards?: any[];
	deckData?: Map<string, TableData>;
	myDecks?: MyDecks;
	queryMap?: QueryMap;
	showFilters?: boolean;
}

interface DeckDiscoverProps extends React.ClassAttributes<DeckDiscover> {
	cardData: Map<string, any>;
	userIsAuthenticated: boolean;
	userIsPremium: boolean;
}

export default class DeckDiscover extends React.Component<DeckDiscoverProps, DeckDiscoverState> {
	private readonly queryManager: QueryManager = new QueryManager();
	private readonly defaultQueryMap: QueryMap = {
		deckType: "",
		excludedCards: "",
		gameType: "RANKED_STANDARD",
		includedCards: "",
		opponentClass: "ALL",
		personal: "",
		playerClass: "ALL",
		rankRange: "ALL",
		region: "ALL",
		sortBy: "popularity",
		sortDirection: "descending",
		timeRange: "LAST_30_DAYS",
	}

	private readonly allowedValues = {
		gameType: ["RANKED_STANDARD", "RANKED_WILD"],
		rankRange: [],
		region: [],
		timeRange: ["LAST_30_DAYS"],
	}

	private readonly allowedValuesPremium = {
		gameType: ["RANKED_STANDARD", "RANKED_WILD"],
		rankRange: ["LEGEND_THROUGH_TEN"],
		region: [],
		timeRange: ["CURRENT_SEASON", "LAST_3_DAYS", "LAST_7_DAYS", "LAST_30_DAYS"],
	}

	constructor(props: DeckDiscoverProps, state: DeckDiscoverState) {
		super(props, state);
		this.state = {
			cardSearchExcludeKey: 0,
			cardSearchIncludeKey: 0,
			cards: null,
			deckData: new Map<string, TableData>(),
			myDecks: null,
			queryMap: getQueryMapFromLocation(this.defaultQueryMap, this.getAllowedValues()),
			showFilters: false,
		}
		this.fetch();
	}

	getAllowedValues(): any {
		return this.props.userIsPremium ? this.allowedValuesPremium : this.allowedValues;
	}

	cacheKey(state?: DeckDiscoverState): string {
		const allowedValues = this.getAllowedValues();
		const queryMap = (state || this.state).queryMap;
		const cacheKey = [];
		Object.keys(allowedValues).forEach(key => {
			const value = allowedValues[key];
			if (value.length) {
				cacheKey.push(queryMap[key]);
			}
		});
		return cacheKey.join("");
	}

	componentDidUpdate(prevProps: DeckDiscoverProps, prevState: DeckDiscoverState) {
		const cacheKey = this.cacheKey();
		const prevCacheKey = this.cacheKey(prevState);
		if (cacheKey !== prevCacheKey) {
			const deckData = this.state.deckData.get(cacheKey);
			if (!deckData || deckData === "error") {
				this.fetch();
			}
		}
		setLocationQueryString(this.state.queryMap, this.defaultQueryMap);
	}

	componentWillReceiveProps(nextProps: DeckDiscoverProps) {
		if (!this.state.cards && nextProps.cardData) {
			const cards = [];
			nextProps.cardData.forEach((card, id) => {
				if (card.name && card.collectible && ["MINION", "SPELL", "WEAPON"].indexOf(card.type) !== -1) {
					cards.push(card);
				}
			});
			cards.sort(cardSorting)
			this.setState({cards});
		}
	}

	getDeckType(totalCost: number): string {
		return totalCost >= 100 ? "control" : (totalCost >= 80 ? "midrange" : "aggro");
	}

	render(): JSX.Element {
		const queryMap = Object.assign({}, this.state.queryMap);
		
		const selectedClass = queryMap["playerClass"];
		const selectedOpponent = queryMap["opponentClass"];
		const decks: DeckObj[] = [];
		const deckData = this.state.deckData.get(this.cacheKey());
		if (this.props.cardData) {
			if (deckData && deckData !== "loading" && deckData !== "error") {
				const deckElements = [];
				const data = deckData.series.data;
				Object.keys(data).forEach(key => {
					if (selectedClass === "ALL" || selectedClass === key) {
						data[key].forEach(deck => {
							const cards = JSON.parse(deck["deck_list"]);
							const deckList = cards.map(c => {return {card: this.props.cardData.get(''+c[0]), count: c[1]}});
							const includedCards = getQueryMapArray(queryMap, "includedCards").map(id => this.props.cardData.get(id));
							if (!includedCards.length || includedCards.every(card => deckList.some(cardObj => cardObj.card.id === card.id))) {
								const excludedCards = getQueryMapArray(queryMap, "excludedCards").map(id => this.props.cardData.get(id));
								if (!excludedCards.length || !excludedCards.some(card => deckList.some(cardObj => cardObj.card.id === card.id))) {
									const costSum = deckList.reduce((a, b) => a + b.card.cost * b.count, 0);
									const deckType = queryMap["deckType"];
									if (!deckType || deckType === this.getDeckType(costSum)) {
										if (!queryMap["personal"] || this.state.myDecks && this.state.myDecks[deck["deck_id"]]) {
											deck["cards"] = deckList;
											deck["player_class"] = key;
											deckElements.push(deck);
										}
									}
								}
							}
						});
					}
				});

				const winrateField = selectedOpponent === "ALL" ? "win_rate" : "win_rate_vs_" + selectedOpponent;
				const numGamesField = selectedOpponent === "ALL" ? "total_games" : "total_games_vs_" + selectedOpponent;
				const sortProp = queryMap["sortBy"] === "winrate" ? winrateField : (queryMap["sortBy"] === "popularity" ? numGamesField : "avg_game_length_seconds");

				const direction = queryMap["sortDirection"] === "descending" ? 1 : -1;
				deckElements.sort((a, b) => (b[sortProp] - a[sortProp]) * direction);

				deckElements.forEach(deck => {
					decks.push({
						cards: deck.cards,
						deckId: deck.deck_id,
						duration: deck.avg_game_length_seconds,
						playerClass: deck.player_class,
						numGames: deck[numGamesField],
						winrate: deck[winrateField],
					});
				});
			}
		}

		let content = null;
		if (!deckData || deckData === "loading" || !this.props.cardData) {
			content = (
				<div className="content-message">
					<h2>Loading...</h2>
				</div>
			);
		}
		else if (deckData === "error") {
			content = (
				<div className="content-message">
					<h2>Counting cards...</h2>
					Please check back later.
				</div>
			);
		}
		else if(decks.length === 0) {
			content = (
				<div className="content-message">
					<h2>No decks found</h2>
					<button className="btn btn-default" type="button" onClick={() => this.setState({queryMap: this.defaultQueryMap})}>Reset filters</button>
				</div>
			);
		}
		else {
			content = <DeckList decks={decks} pageSize={12} />;
		}

		const filterClassNames = ["infobox full-sm"];
		const contentClassNames = ["deck-list-wrapper"]
		if (!this.state.showFilters) {
			filterClassNames.push("hidden-xs hidden-sm");
		}
		else {
			contentClassNames.push("hidden-xs hidden-sm");
		}

		const backButton = (
			<button className="btn btn-primary btn-full visible-sm visible-xs" type="button" onClick={() => this.setState({showFilters: false})}>
				Back to card list
			</button>
		);

		const personalDisabled = !this.props.userIsAuthenticated || !this.state.myDecks;

		let loginLink = null;
		if (!this.props.userIsAuthenticated) {
			loginLink = <a className="infobox-value" href="/account/login/?next=/decks/">Log in</a>;
		}

		return (
			<div className="deck-discover">
				<div className={filterClassNames.join(" ")} id="deck-discover-infobox">
					{backButton}
					<ResetHeader onReset={() => this.setState({queryMap: this.defaultQueryMap})} showReset={queryMapHasChanges(this.state.queryMap, this.defaultQueryMap)}>
						Deck Database
					</ResetHeader>
					<h2>Class</h2>
						<ClassFilter 
							filters="All"
							hideAll
							minimal
							multiSelect={false}
							selectedClasses={[queryMap["playerClass"] as FilterOption]}
							selectionChanged={(selected) => setQueryMap(this, "playerClass", selected[0])}
						/>
					<PremiumWrapper isPremium={this.props.userIsPremium}>
						<h2>Winrate vs</h2>
						<ClassFilter 
							filters="All"
							hideAll
							minimal
							multiSelect={false}
							selectedClasses={[queryMap["opponentClass"] as FilterOption]}
							selectionChanged={(selected) => this.props.userIsPremium && setQueryMap(this, "opponentClass", selected[0])}
						/>
					</PremiumWrapper>
					<h2>Include cards</h2>
					<CardSearch
						key={"cardinclude" + this.state.cardSearchIncludeKey}
						availableCards={this.state.cards}
						onCardsChanged={(cards) => setQueryMap(this, "includedCards", cards.map(card => card.dbfId).join(","))}
						selectedCards={this.props.cardData && queryMap["includedCards"] && queryMap["includedCards"].split(",").map(id => this.props.cardData.get(id))}
					/>
					<h2>Exclude cards</h2>
					<CardSearch
						key={"cardexclude" + this.state.cardSearchExcludeKey}
						availableCards={this.state.cards}
						onCardsChanged={(cards) => setQueryMap(this, "excludedCards", cards.map(card => card.dbfId).join(","))}
						selectedCards={this.props.cardData && queryMap["excludedCards"] && queryMap["excludedCards"].split(",").map(id => this.props.cardData.get(id))}
					/>
					<h2>Personal</h2>
					<InfoboxFilterGroup deselectable selectedValue={this.state.queryMap["personal"]} onClick={(value) => setQueryMap(this, "personal", value)}>
						<InfoboxFilter value="true" disabled={personalDisabled}>
							My decks (last 30 days)
							{loginLink}
						</InfoboxFilter>
					</InfoboxFilterGroup>
					<h2>Deck type</h2>
					<InfoboxFilterGroup deselectable selectedValue={this.state.queryMap["deckType"]} onClick={(value) => setQueryMap(this, "deckType", value)}>
						<InfoboxFilter value="aggro">Aggro</InfoboxFilter>
						<InfoboxFilter value="midrange">Midrange</InfoboxFilter>
						<InfoboxFilter value="control">Control</InfoboxFilter>
					</InfoboxFilterGroup>
					<h2>Mode</h2>
					<InfoboxFilterGroup selectedValue={this.state.queryMap["gameType"]} onClick={(value) => setQueryMap(this, "gameType", value)}>
						<InfoboxFilter value="RANKED_STANDARD">Standard</InfoboxFilter>
						<InfoboxFilter value="RANKED_WILD">Wild</InfoboxFilter>
					</InfoboxFilterGroup>
					<PremiumWrapper isPremium={this.props.userIsPremium}>
						<h2>Time frame</h2>
						<InfoboxFilterGroup locked={!this.props.userIsPremium} selectedValue={this.state.queryMap["timeRange"]} onClick={(value) => setQueryMap(this, "timeRange", value)}>
							<InfoboxFilter value="CURRENT_SEASON">Current Season</InfoboxFilter>
							<InfoboxFilter value="LAST_3_DAYS">Last 3 days</InfoboxFilter>
							<InfoboxFilter value="LAST_7_DAYS">Last 7 days</InfoboxFilter>
							<InfoboxFilter value="LAST_30_DAYS">Last 30 days</InfoboxFilter>
						</InfoboxFilterGroup>
					</PremiumWrapper>
					<PremiumWrapper isPremium={this.props.userIsPremium}>
						<h2>Rank range</h2>
						<InfoboxFilterGroup deselectable locked={!this.props.userIsPremium} selectedValue={this.state.queryMap["rankRange"]} onClick={(value) => setQueryMap(this, "rankRange", value)}>
							<InfoboxFilter value="LEGEND_THROUGH_TEN">Legend - 10</InfoboxFilter>
						</InfoboxFilterGroup>
					</PremiumWrapper>
					<h2>Sort by</h2>
					<InfoboxFilterGroup selectedValue={this.state.queryMap["sortBy"]} onClick={(value) => setQueryMap(this, "sortBy", value)}>
						<InfoboxFilter value="duration">Duration</InfoboxFilter>
						<InfoboxFilter value="popularity">Popularity</InfoboxFilter>
						<InfoboxFilter value="winrate">Winrate</InfoboxFilter>
					</InfoboxFilterGroup>
					<h2>Sort Direction</h2>
					<InfoboxFilterGroup selectedValue={this.state.queryMap["sortDirection"]} onClick={(value) => setQueryMap(this, "sortDirection", value)}>
						<InfoboxFilter value="ascending">Ascending</InfoboxFilter>
						<InfoboxFilter value="descending">Descending</InfoboxFilter>
					</InfoboxFilterGroup>
					{backButton}
				</div>
				<div className={contentClassNames.join(" ")}>
					<button
						className="btn btn-default pull-left visible-xs visible-sm"
						type="button"
						onClick={() => this.setState({showFilters: true})}
					>
						<span className="glyphicon glyphicon-filter"/>
						Filters
					</button>
					{content}
				</div>
			</div>
		);
	}

	fetch() {
		const params = {
			TimeRange: this.state.queryMap["timeRange"] || this.defaultQueryMap["timeRange"],
			RankRange: this.state.queryMap["rankRange"] || this.defaultQueryMap["rankRange"],
			GameType: this.state.queryMap["gameType"] || this.defaultQueryMap["gameType"],
			// Region: this.state.queryMap["region"],
		};

		const query = this.props.userIsPremium ? "list_decks_by_opponent_win_rate" : "list_decks_by_win_rate";
		this.queryManager.fetch(
			"/analytics/query/" + query + "?" + toQueryString(params),
			(data) => this.setState({deckData: this.state.deckData.set(this.cacheKey(), data)})
		);
		
		if (!this.state.myDecks) {
			this.queryManager.fetch("/decks/mine/", (data) => this.setState({myDecks: data}));
		}
	}
}
