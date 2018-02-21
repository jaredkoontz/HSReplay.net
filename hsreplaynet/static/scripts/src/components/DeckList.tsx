import React from "react";
import * as _ from "lodash";
import DeckTile from "./DeckTile";
import InfoIcon from "./InfoIcon";
import Pager from "./Pager";
import SortIndicator from "./SortIndicator";
import {
	CardObj,
	DeckObj,
	FragmentChildProps,
	SortDirection
} from "../interfaces";
import { getDustCost, getManaCost } from "../helpers";
import DataManager from "../DataManager";

interface Props extends FragmentChildProps {
	decks: DeckObj[];
	pageSize: number;
	hideTopPager?: boolean;
	compareWith?: CardObj[];
	sortBy?: string;
	setSortBy?: (sortBy: string) => void;
	sortDirection?: SortDirection;
	setSortDirection?: (sortDirection: SortDirection) => void;
	page?: number;
	setPage?: (page: number) => void;
	helpMessage?: string;
	hrefTab?: string;
	lastPlayedColumn?: boolean;
	showGlobalDataNotice?: boolean;
	infoRow?: JSX.Element;
}

interface State {
	archetypeData?: any[];
}

export default class DeckList extends React.Component<Props, State> {
	private cache: any;

	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			archetypeData: []
		};
		this.cache = {};
		this.cacheDecks(props.decks);
		this.fetchArchetypeDict();
	}

	public componentWillReceiveProps(
		nextProps: Readonly<Props>,
		nextContext: any
	): void {
		if (
			this.props.setPage &&
			(!_.isEqual(nextProps.decks, this.props.decks) ||
				nextProps.pageSize !== this.props.pageSize ||
				nextProps.sortBy !== this.props.sortBy ||
				nextProps.sortDirection !== this.props.sortDirection)
		) {
			this.props.setPage(1);
		}
		this.cacheDecks(nextProps.decks);
	}

	cacheDecks(decks: DeckObj[]) {
		for (const i in decks) {
			const deck = decks[i];
			const id = deck.deckId;
			if (typeof this.cache[id] !== "undefined") {
				continue;
			}
			this.cache[id] = {
				dust: getDustCost(deck.cards),
				mana: getManaCost(deck.cards)
			};
		}
	}

	fetchArchetypeDict() {
		DataManager.get("/api/v1/archetypes/").then(data => {
			if (data) {
				this.setState({ archetypeData: data });
			}
		});
	}

	public render(): React.ReactNode {
		const currentPage =
			typeof this.props.page !== "undefined" ? this.props.page : 1;
		const pageOffset = (currentPage - 1) * this.props.pageSize;
		const nextPageOffset = pageOffset + this.props.pageSize;
		const deckCount = this.props.decks.length;

		let cacheProp = null;
		let sortProp = this.props.sortBy;
		switch (sortProp) {
			case "winrate":
				sortProp = "winrate";
				break;
			case "popularity":
				sortProp = "numGames";
				break;
			case "duration":
				sortProp = "duration";
				break;
			case "lastPlayed":
				sortProp = "lastPlayed";
				break;
			case "dust":
				cacheProp = "dust";
				break;
			case "mana":
				cacheProp = "mana";
				break;
		}

		const decks = this.props.decks.slice(0);

		if (sortProp) {
			const direction = this.props.sortDirection === "ascending" ? 1 : -1;
			decks.sort((a: DeckObj, b: DeckObj) => {
				let x = +a[sortProp];
				let y = +b[sortProp];
				if (cacheProp !== null) {
					x = +this.cache[a.deckId][cacheProp];
					y = +this.cache[b.deckId][cacheProp];
				}
				if (x !== y) {
					return (x - y) * direction;
				}
				return a.deckId.localeCompare(b.deckId) * direction;
			});
		}

		const deckTiles = [];
		const visibleDecks = decks.slice(pageOffset, nextPageOffset);
		visibleDecks.forEach(deck => {
			const archetype = this.state.archetypeData.find(
				x => x.id === deck.archetypeId
			);
			deckTiles.push(
				<DeckTile
					key={deck.deckId}
					cards={deck.cards}
					deckId={deck.deckId}
					duration={deck.duration}
					playerClass={deck.playerClass}
					numGames={deck.numGames}
					winrate={deck.winrate}
					compareWith={this.props.compareWith}
					dustCost={this.cache[deck.deckId].dust}
					hasGlobalData={
						this.props.showGlobalDataNotice && deck.hasGlobalData
					}
					archetypeName={archetype && archetype.name}
					archetypeId={archetype && archetype.id}
					hrefTab={this.props.hrefTab}
					lastPlayed={deck.lastPlayed}
				/>
			);
		});

		const min = pageOffset + 1;
		const max = Math.min(pageOffset + this.props.pageSize, deckCount);
		const pager = top => {
			if (
				this.props.decks.length <= this.props.pageSize ||
				!this.props.setPage
			) {
				return null;
			}
			return (
				<div
					className={
						"paging " +
						(top ? "pull-right paging-top" : "text-center")
					}
				>
					<Pager
						currentPage={this.props.page}
						setCurrentPage={this.props.setPage}
						pageCount={Math.ceil(deckCount / this.props.pageSize)}
					/>
				</div>
			);
		};

		const isSortable =
			typeof this.props.setSortBy === "function" &&
			typeof this.props.setSortDirection === "function";
		const sortIndicator = (name: string): JSX.Element => {
			if (!isSortable) {
				return null;
			}
			return (
				<SortIndicator
					direction={
						name === this.props.sortBy
							? this.props.sortDirection
							: null
					}
				/>
			);
		};

		const headerSortable = isSortable ? "header-sortable " : "";

		const sort = (name: string): void => {
			if (this.props.sortBy === name) {
				if (this.props.setSortDirection) {
					this.props.setSortDirection(
						this.props.sortDirection === "ascending"
							? "descending"
							: "ascending"
					);
				}
			} else {
				this.props.setSortDirection &&
					this.props.setSortDirection("descending");
				this.props.setSortBy && this.props.setSortBy(name);
			}
		};

		const onClick = (name: string, event?) => {
			if (!this.props.setSortDirection && !this.props.setSortBy) {
				return;
			}
			if (event) {
				event.preventDefault();
				if (event.currentTarget) {
					event.currentTarget.blur();
				}
			}
			sort(name);
		};

		const onKeyPress = (name: string, event?) => {
			if (event && event.which !== 13) {
				return;
			}

			sort(name);
		};

		const sortDirection = (name: string) =>
			this.props.sortBy === name ? this.props.sortDirection : "none";

		const tabIndex = isSortable ? 0 : -1;

		let firstHeader = null;
		if (this.props.lastPlayedColumn) {
			firstHeader = (
				<div
					className={
						headerSortable + "col-lg-2 col-md-2 col-sm-2 col-xs-6"
					}
					onClick={e => onClick("lastPlayed", e)}
					onKeyPress={e => onKeyPress("lastPlayed", e)}
					tabIndex={tabIndex}
					role="columnheader"
					aria-sort={sortDirection("lastPlayed")}
				>
					<span>
						Deck / <span aria-hidden="true">Last Played</span>
					</span>
					{sortIndicator("lastPlayed")}
					<InfoIcon
						header="Last Played"
						content="Time since you last played the deck."
					/>
				</div>
			);
		} else {
			firstHeader = (
				<div
					className={
						headerSortable + "col-lg-2 col-md-2 col-sm-2 col-xs-6"
					}
					onClick={e => onClick("dust", e)}
					onKeyPress={e => onKeyPress("dust", e)}
					tabIndex={tabIndex}
					role="columnheader"
					aria-sort={sortDirection("dust")}
				>
					<span>
						Deck / <span aria-hidden="true">Cost</span>
					</span>
					{sortIndicator("dust")}
					<InfoIcon
						header="Crafting Cost"
						content="Total amount of dust required to craft the deck."
					/>
				</div>
			);
		}

		return (
			<div className="deck-list">
				{this.props.helpMessage ? (
					<p className="help-block pull-left">
						<span className="visible-sm-inline">&nbsp;</span>
						{this.props.helpMessage}
					</p>
				) : null}
				{!this.props.hideTopPager && pager(true)}
				<div className="clearfix" />
				<div className="row header-row">
					{firstHeader}
					<div
						className={
							headerSortable +
							"header-center col-lg-1 col-md-1 col-sm-1 col-xs-3"
						}
						onClick={e => onClick("winrate", e)}
						onKeyPress={e => onKeyPress("winrate", e)}
						tabIndex={tabIndex}
						role="columnheader"
						aria-sort={sortDirection("winrate")}
					>
						<span aria-hidden="true">Winrate</span>
						{sortIndicator("winrate")}
						<InfoIcon
							header="Winrate"
							content="Percentage of games won by the deck."
						/>
					</div>
					<div
						className={
							headerSortable +
							"header-center col-lg-1 col-md-1 col-sm-1 col-xs-3"
						}
						onClick={e => onClick("popularity", e)}
						onKeyPress={e => onKeyPress("popularity", e)}
						tabIndex={tabIndex}
						role="columnheader"
						aria-sort={sortDirection("popularity")}
					>
						<span aria-hidden="true">Games</span>
						{sortIndicator("popularity")}
						<InfoIcon
							header="Games Played"
							content="Number of recorded games where the deck is played."
						/>
					</div>
					<div
						className={
							headerSortable +
							"header-center col-lg-1 col-md-1 hidden-sm hidden-xs"
						}
						onClick={e => onClick("duration", e)}
						onKeyPress={e => onKeyPress("duration", e)}
						tabIndex={tabIndex}
						role="columnheader"
						aria-sort={sortDirection("duration")}
					>
						<span aria-hidden="true">Duration</span>
						{sortIndicator("duration")}
						<InfoIcon
							header="Game Duration"
							content="How long a game takes on average when the deck is played."
						/>
					</div>
					<div
						className={
							headerSortable +
							"header-center col-lg-1 hidden-md hidden-sm hidden-xs"
						}
						onClick={e => onClick("mana", e)}
						onKeyPress={e => onKeyPress("mana", e)}
						tabIndex={tabIndex}
						role="columnheader"
						aria-sort={sortDirection("mana")}
					>
						<span aria-hidden="true">Mana</span>
						{sortIndicator("mana")}
						<InfoIcon
							header="Mana Curve"
							content="Distribution of card costs for the deck."
						/>
					</div>
					<div
						className="col-lg-6 col-md-7 col-sm-8 hidden-xs"
						role="columnheader"
					>
						{this.props.compareWith ? "Changes" : "Cards"}
					</div>
				</div>
				<ul>
					{this.props.infoRow}
					{deckTiles}
				</ul>
				{pager(false)}
			</div>
		);
	}
}
