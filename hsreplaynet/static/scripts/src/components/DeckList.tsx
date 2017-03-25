import * as React from "react";
import DeckTile from "./DeckTile";
import InfoIcon from "./InfoIcon";
import Pager from "./Pager";
import SortIndicator from "./SortIndicator";
import {SortDirection} from "./SortableTable";
import {CardObj, DeckObj} from "../interfaces";

interface DeckListState {
	page: number;
}

interface DeckListProps extends React.ClassAttributes<DeckList> {
	decks: DeckObj[];
	pageSize: number;
	urlGameType: string;
	hideTopPager?: boolean;
	compareWith?: CardObj[];
	onHeaderClicked?: (name: string) => void;
	sortCol?: string;
	sortDirection?: SortDirection;
}

export default class DeckList extends React.Component<DeckListProps, DeckListState> {
	constructor(props: DeckListProps, state: DeckListState) {
		super(props, state);
		this.state = {
			page: 0,
		};
	}

	componentWillReceiveProps(nextProps: DeckListProps) {
		if (nextProps.decks !== this.props.decks
			|| nextProps.pageSize !== this.props.pageSize) {
			this.setState({page: 0});
		}
	}

	render(): JSX.Element {
		const pageOffset = this.state.page * this.props.pageSize;
		const nextPageOffset = pageOffset + this.props.pageSize;
		const deckCount = this.props.decks.length;

		const deckTiles = [];
		const visibleDecks = this.props.decks.slice(pageOffset, nextPageOffset);
		visibleDecks.forEach((deck) => {
			deckTiles.push(
				<DeckTile
					cards={deck.cards}
					deckId={deck.deckId}
					duration={deck.duration}
					playerClass={deck.playerClass}
					numGames={deck.numGames}
					winrate={deck.winrate}
					compareWith={this.props.compareWith}
					urlGameType={this.props.urlGameType}
				/>,
			);
		});

		let next = null;
		if (deckCount > nextPageOffset) {
			next = () => this.setState({page: this.state.page + 1});
		}

		let prev = null;
		if (this.state.page > 0) {
			prev = () => this.setState({page: this.state.page - 1});
		}

		const min = pageOffset + 1;
		const max = Math.min(pageOffset + this.props.pageSize, deckCount);
		const pager = (top) => {
			if (this.props.decks.length <= this.props.pageSize) {
				return null;
			}
			return (
				<div className="paging pull-right">
					<span className={top ? "hidden-xs" : null}>{min + "–" + max + " out of  " + deckCount}</span>
					<Pager previous={prev} next={next} />
				</div>
			);
		};

		const sortIndicator = (name: string): JSX.Element => {
			if (!this.props.onHeaderClicked) {
				return null;
			}
			return <SortIndicator
				direction={name === this.props.sortCol ? this.props.sortDirection : null}
			/>;
		};

		const headerSortable = this.props.onHeaderClicked ? "header-sortable " : "";
		const onClick = (key: string) => this.props.onHeaderClicked && this.props.onHeaderClicked(key);

		return (
			<div className="deck-list">
				{!this.props.hideTopPager && pager(true)}
				<div className="clearfix" />
				<div className="row header-row">
					<div className={headerSortable + "col-lg-2 col-md-2 col-sm-2 col-xs-6"} onClick={() => onClick("dust_cost")}>
						Deck / Cost
						{sortIndicator("dust_cost")}
						<InfoIcon header="Crafting Cost" content="Total amount of dust required to craft the deck."/>
					</div>
					<div className={headerSortable + "header-center col-lg-1 col-md-1 col-sm-1 col-xs-3"} onClick={() => onClick("winrate")}>
						Winrate
						{sortIndicator("winrate")}
						<InfoIcon header="Winrate" content="Percentage of games won by the deck." />
					</div>
					<div className={headerSortable + "header-center col-lg-1 col-md-1 col-sm-1 col-xs-3"} onClick={() => onClick("popularity")}>
						Games
						{sortIndicator("popularity")}
						<InfoIcon header="Games Played" content="Number of recorded games where the deck is played." />
					</div>
					<div className={headerSortable + "header-center col-lg-1 col-md-1 hidden-sm hidden-xs"} onClick={() => onClick("duration")}>
						Duration
						{sortIndicator("duration")}
						<InfoIcon header="Game Duration" content="How long a game takes on average when the deck is played." />
					</div>
					<div className={headerSortable + "header-center col-lg-1 hidden-md hidden-sm hidden-xs"} onClick={() => onClick("mana_cost")}>
						Mana
						{sortIndicator("mana_cost")}
						<InfoIcon header="Mana Curve" content="Distribution of card costs for the deck." />
					</div>
					<div className="col-lg-6 col-md-7 col-sm-8 hidden-xs">
						{this.props.compareWith ? "Changes" : "Cards"}
					</div>
				</div>
				<ul>
					{deckTiles}
				</ul>
				{pager(false)}
			</div>
		);
	}
}
