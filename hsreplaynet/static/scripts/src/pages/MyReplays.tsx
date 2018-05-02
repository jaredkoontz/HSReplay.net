import { cookie } from "cookie_js";
import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import ClassDistributionPieChart from "../components/charts/ClassDistributionPieChart";
import ClassFilter, { FilterOption } from "../components/ClassFilter";
import GameHistoryList from "../components/gamehistory/GameHistoryList";
import GameHistorySearch from "../components/gamehistory/GameHistorySearch";
import GameHistoryTable from "../components/gamehistory/GameHistoryTable";
import InfoboxFilter from "../components/InfoboxFilter";
import InfoboxFilterGroup from "../components/InfoboxFilterGroup";
import Pager from "../components/Pager";
import ResetHeader from "../components/ResetHeader";
import {
	formatMatch,
	heroMatch,
	modeMatch,
	nameMatch,
	resultMatch,
} from "../GameFilters";
import {
	CardArtProps,
	FragmentChildProps,
	GameReplay,
	ImageProps,
} from "../interfaces";
import CardData from "../CardData";
import { getHeroCard } from "../helpers";

type ViewType = "tiles" | "list";

interface GamesPage {
	[index: number]: GameReplay[];
}

interface Props
	extends ImageProps,
		CardArtProps,
		FragmentChildProps,
		InjectedTranslateProps {
	cardData: CardData;
	username: string;
	name?: string;
	setName?: (name: string) => void;
	mode?: string;
	setMode?: (mode: string) => void;
	format?: string;
	setFormat?: (format: string) => void;
	result?: string;
	setResult?: (result: string) => void;
	hero?: string;
	setHero?: (hero: string) => void;
	opponent?: string;
	setOpponent?: (opponent: string) => void;
}

interface State {
	count: number;
	currentLocalPage: number;
	gamesPages: GamesPage;
	next: string | null;
	pageSize: number;
	receivedPages: number;
	showFilters: boolean;
	viewType: ViewType;
	working: boolean;
}

class MyReplays extends React.Component<Props, State> {
	readonly viewCookie: string = "myreplays_viewtype";

	constructor(props: Props, context?: any) {
		super(props, context);
		const viewType = cookie.get(this.viewCookie, "tiles") as ViewType;
		this.state = {
			count: 0,
			currentLocalPage: 0,
			gamesPages: {} as GamesPage,
			next: null,
			pageSize: 1,
			receivedPages: 0,
			showFilters: false,
			viewType,
			working: true,
		};
		this.query(
			"/api/v1/games/?username=" + encodeURIComponent(props.username),
		);
	}

	protected query(url: string) {
		this.setState({
			working: true,
		});
		fetch(url, {
			credentials: "include",
			headers: new Headers({ accept: "application/json" }),
		})
			.then(response => response.json())
			.then((data: any) => {
				let games = [];
				const next = data.next || null;
				if (data.count) {
					if (this.state.count && this.state.count !== data.count) {
						this.setState({
							count: data.count,
							gamesPages: {},
							receivedPages: 0,
						});
						this.query("/api/v1/games/");
						return;
					}
					games = data.results;

					if (
						Object.keys(this.state.gamesPages).indexOf(
							"" + this.state.receivedPages,
						) === -1
					) {
						const pages = Object.assign({}, this.state.gamesPages);
						pages[this.state.receivedPages] = games;
						this.setState({
							count: data.count,
							gamesPages: pages,
							next,
							pageSize: Math.max(
								this.state.pageSize,
								games.length,
							),
							receivedPages: this.state.receivedPages + 1,
							working: false,
						});
						return;
					}
				}
				this.setState({
					count: data.count,
					next,
					working: false,
				});
			});
	}

	filterGames(input: GameReplay[]): GameReplay[] {
		let games = input;
		const name = this.props.name;
		const mode = this.props.mode;
		const format = this.props.format;
		const result = this.props.result;
		const hero = this.props.hero !== "ALL" ? this.props.hero : null;
		const opponent =
			this.props.opponent !== "ALL" ? this.props.opponent : null;
		if (this.props.canBeReset) {
			games = games.filter(game => {
				if (name && !nameMatch(game, name.toLowerCase())) {
					return false;
				}
				if (mode && !modeMatch(game, mode)) {
					return false;
				}
				if (format && !formatMatch(game, format, mode)) {
					return false;
				}
				if (result && !resultMatch(game, result)) {
					return false;
				}
				if (
					hero &&
					!heroMatch(this.props.cardData, game.friendly_player, hero)
				) {
					return false;
				}
				if (
					opponent &&
					!heroMatch(
						this.props.cardData,
						game.opposing_player,
						opponent,
					)
				) {
					return false;
				}
				return true;
			});
		}
		return games;
	}

	buildChartData(games: GameReplay[]): any[] {
		if (!this.props.cardData) {
			return [];
		}
		const data = [];
		const heroGames = {};
		const heroWins = {};
		games.forEach((game: GameReplay) => {
			if (game.friendly_player) {
				const heroCard = getHeroCard(
					this.props.cardData,
					game.friendly_player,
				);
				if (heroCard !== null) {
					const hero = heroCard.cardClass;
					heroGames[hero] = (heroGames[hero] || 0) + 1;
					if (game.won) {
						heroWins[hero] = (heroWins[hero] || 0) + 1;
					}
				}
			}
		});
		Object.keys(heroGames).forEach(key => {
			const value = heroGames[key];
			data.push({
				x: key,
				y: value,
				winrate: (heroWins[key] || 0) / value,
			});
		});
		data.sort((a, b) => (a.y > b.y ? 1 : -1));
		return data;
	}

	public render(): React.ReactNode {
		const { t } = this.props;
		let games: GameReplay[] = [];
		const hasFilters = this.props.canBeReset;

		let page = 0;
		const firstPage = this.state.gamesPages[page];
		if (firstPage) {
			games = this.filterGames(firstPage);
			// we load one more than we need so we know whether there is next page
			while (
				games.length <
				this.state.pageSize * (this.state.currentLocalPage + 1) + 1
			) {
				const nextPage = this.state.gamesPages[++page];
				if (!nextPage) {
					if (
						this.state.next &&
						!this.state.working &&
						(hasFilters || page === this.state.currentLocalPage)
					) {
						this.query(this.state.next);
					}
					break;
				}
				games = games.concat(this.filterGames(nextPage));
			}
			// slice off everything before the currentLocalPage
			games = games.slice(
				this.state.pageSize * this.state.currentLocalPage,
			);
		}

		const hasNext =
			(!hasFilters && this.state.next) ||
			games.length > this.state.pageSize;
		if (hasNext) {
			games = games.slice(0, this.state.pageSize);
		}

		let content = null;
		if (games.length) {
			content =
				this.state.viewType === "list" ? (
					<GameHistoryTable
						image={this.props.image}
						cardArt={this.props.cardArt}
						games={games}
					/>
				) : (
					<GameHistoryList
						image={this.props.image}
						cardArt={this.props.cardArt}
						games={games}
					/>
				);
		} else {
			let message = null;
			if (this.state.working) {
				message = <p>{t("Loading replays…")}</p>;
			} else {
				message = (
					<div>
						<h2>{t("No replay found")}</h2>
						{this.props.canBeReset ? (
							<p>
								<a
									href="#"
									onClick={e => {
										e.preventDefault();
										this.props.reset();
									}}
								>
									{t("Reset filters")}
								</a>
							</p>
						) : null}
					</div>
				);
			}
			content = <div className="list-message">{message}</div>;
		}

		const filterClassNames = ["infobox full-sm"];
		const contentClassNames = ["replay-list"];
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
				{t("Back to replays")}
			</button>
		);

		const pager = (
			<Pager
				currentPage={this.state.currentLocalPage + 1}
				setCurrentPage={(p: number) =>
					this.setState({ currentLocalPage: p - 1 })
				}
				pageCount={
					this.state.next
						? null
						: Object.keys(this.state.gamesPages).length
				}
				minimal
			/>
		);

		return (
			<div className="my-replays-content">
				<div
					className={filterClassNames.join(" ")}
					id="myreplays-infobox"
				>
					{backButton}
					<ResetHeader
						onReset={() => this.props.reset()}
						showReset={this.props.canBeReset}
					>
						{t("My Replays")}
					</ResetHeader>
					<h2>{t("Classes played")}</h2>
					<ClassDistributionPieChart
						data={this.buildChartData(games)}
						loading={this.state.working}
						onPieceClicked={(hero: string) =>
							this.onPiePieceClicked(hero)
						}
					/>
					<h2>Display</h2>
					<InfoboxFilterGroup
						selectedValue={this.state.viewType}
						onClick={value => this.setView(value as ViewType)}
					>
						<InfoboxFilter value="list">List view</InfoboxFilter>
						<InfoboxFilter value="tiles">Tile view</InfoboxFilter>
					</InfoboxFilterGroup>
					<h2>{t("Player class")}</h2>
					<ClassFilter
						filters="All"
						hideAll
						minimal
						selectedClasses={[
							this.props.hero.toUpperCase() as FilterOption,
						]}
						selectionChanged={selection => {
							const selected =
								selection.find(x => x !== "ALL") || null;
							this.props.setHero(
								selected && selected.toLowerCase(),
							);
							this.setState({
								currentLocalPage: 0,
							});
						}}
					/>
					<h2>{t("Opponent class")}</h2>
					<ClassFilter
						filters="All"
						hideAll
						minimal
						selectedClasses={[
							this.props.opponent.toUpperCase() as FilterOption,
						]}
						selectionChanged={selection => {
							const selected =
								selection.find(x => x !== "ALL") || null;
							this.props.setOpponent(
								selected && selected.toLowerCase(),
							);
							this.setState({
								currentLocalPage: 0,
							});
						}}
					/>
					<h2>{t("Find players")}</h2>
					<GameHistorySearch
						query={this.props.name}
						setQuery={(name: string) => this.props.setName(name)}
					/>
					<h2>{t("Game mode")}</h2>
					<InfoboxFilterGroup
						deselectable
						selectedValue={this.props.mode}
						onClick={mode => this.props.setMode(mode)}
					>
						<InfoboxFilter value="arena">
							{t("Arena")}
						</InfoboxFilter>
						<InfoboxFilter value="ranked">
							{t("Ranked")}
						</InfoboxFilter>
						<InfoboxFilter value="casual">
							{t("Casual")}
						</InfoboxFilter>
						<InfoboxFilter value="brawl">
							{t("Tavern Brawl")}
						</InfoboxFilter>
						<InfoboxFilter value="friendly">
							{t("Friendly")}
						</InfoboxFilter>
						<InfoboxFilter value="adventure">
							{t("Adventure")}
						</InfoboxFilter>
					</InfoboxFilterGroup>
					<h2>{t("Game format")}</h2>
					<InfoboxFilterGroup
						deselectable
						selectedValue={this.props.format}
						onClick={format => this.props.setFormat(format)}
					>
						<InfoboxFilter value="standard">
							{t("Standard")}
						</InfoboxFilter>
						<InfoboxFilter value="wild">{t("Wild")}</InfoboxFilter>
					</InfoboxFilterGroup>
					<h2>{t("Result")}</h2>
					<InfoboxFilterGroup
						deselectable
						selectedValue={this.props.result}
						onClick={result => this.props.setResult(result)}
					>
						<InfoboxFilter value="won">{t("Won")}</InfoboxFilter>
						<InfoboxFilter value="lost">{t("Lost")}</InfoboxFilter>
					</InfoboxFilterGroup>
					{backButton}
				</div>
				<div className={contentClassNames.join(" ")}>
					<div className="header-buttons">
						<button
							className="btn btn-default pull-left visible-xs visible-sm"
							type="button"
							onClick={() => this.setState({ showFilters: true })}
						>
							<span className="glyphicon glyphicon-filter" />
							{t("Filters")}
						</button>
						<div className="pull-right">{pager}</div>
						<div className="clearfix" />
					</div>
					{content}
					<div className="pull-right">{pager}</div>
				</div>
			</div>
		);
	}

	private setView(view: ViewType) {
		if (this.state.viewType !== view) {
			cookie.set(this.viewCookie, view, { expires: 365 });
			this.setState({ viewType: view });
		}
	}

	private onPiePieceClicked(hero: string) {
		this.props.setHero(this.props.hero === hero ? null : hero);
		this.setState({
			currentLocalPage: 0,
		});
	}
}

export default translate()(MyReplays);
