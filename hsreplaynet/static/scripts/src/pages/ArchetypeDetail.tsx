import { DeckObj, LoadingStatus, SortDirection } from "../interfaces";
import { AutoSizer } from "react-virtualized";
import DataManager from "../DataManager";
import UserData from "../UserData";
import TabList from "../components/layout/TabList";
import Tab from "../components/layout/Tab";
import DataInjector from "../components/DataInjector";
import ChartLoading from "../components/loading/ChartLoading";
import InfoboxFilterGroup from "../components/InfoboxFilterGroup";
import InfoboxFilter from "../components/InfoboxFilter";
import PremiumWrapper from "../components/premium/PremiumWrapper";
import DeckList from "../components/DeckList";
import CardData from "../CardData";
import React from "react";
import ArchetypeMatchups from "../components/archetypedetail/ArchetypeMatchups";
import ArchetypeDistributionPieChart from "../components/archetypedetail/ArchetypeDistributionPieChart";
import PopularityLineChart from "../components/charts/PopularityLineChart";
import InfoIcon from "../components/InfoIcon";
import WinrateLineChart from "../components/charts/WinrateLineChart";
import { getHeroSkinCardUrl, isWildSet } from "../helpers";
import ArchetypeSignature from "../components/archetypedetail/ArchetypeSignature";
import { extractSignature } from "../extractors";
import CardTable from "../components/tables/CardTable";
import PremiumPromo from "../components/premium/PremiumPromo";
import WinrateBox from "../components/box/WinrateBox";
import PopularityBox from "../components/box/PopularityBox";
import MatchupBox from "../components/box/MatchupBox";
import DeckBox from "../components/box/DeckBox";
import { Archetype, Collection } from "../utils/api";

interface Props {
	archetypeId: number;
	archetypeName: string;
	hasStandardData: boolean;
	hasWildData: boolean;
	playerClass: string;
	cardData: CardData;
	collection: Collection | null;
	gameType?: string;
	setGameType?: (gameType: string) => void;
	rankRange?: string;
	setRankRange?: (rankRange: string) => void;
	tab?: string;
	setTab?: (tab: string) => void;
}

interface State {
	deckData: any;
	popularDecks: DeckObj[];
	popularDecksPage: number;
	popularDecksSortBy: string;
	popularDecksSortDirection: SortDirection;
	mulliganGuideSortBy: string;
	mulliganGuideSortDirection: string;
}

export default class ArchetypeDetail extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			deckData: null,
			popularDecks: [],
			popularDecksPage: 1,
			popularDecksSortBy: "popularity",
			popularDecksSortDirection: "descending",
			mulliganGuideSortBy: "card",
			mulliganGuideSortDirection: "ascending",
		};

		this.fixGameTypeFragments();
		this.fetchDeckData(props);
	}

	hasData(props?: Props): boolean {
		const { gameType, hasWildData, hasStandardData } = props || this.props;
		return (gameType === "RANKED_WILD" && hasWildData) || hasStandardData;
	}

	fixGameTypeFragments() {
		const gameType = this.getGameType();
		if (gameType !== this.props.gameType) {
			this.props.setGameType(gameType);
		}
	}

	fetchDeckData(props: Props) {
		if (!this.hasData(props)) {
			return;
		}
		const params = {
			GameType: this.getGameType(props),
			RankRange: props.rankRange,
		};
		const setDeckData = data => {
			this.setState({ deckData: data.series.data }, () =>
				this.updateData(this.props.cardData),
			);
		};
		DataManager.get("list_decks_by_win_rate", params)
			.then(data => {
				setDeckData(data);
			})
			.catch(reason => {
				setDeckData(null);
				if (reason !== 202) {
					console.error("Could not fetch deck data.", reason);
				}
			});
	}

	updateData(cardData: CardData) {
		const { deckData } = this.state;
		if (!cardData || !deckData) {
			return;
		}
		const { archetypeId, playerClass } = this.props;

		const archetypeDecks = deckData[playerClass].filter(
			deck => deck.archetype_id === archetypeId,
		);
		if (!archetypeDecks.length) {
			this.setState({ popularDecks: [] });
			return;
		}

		const decks: DeckObj[] = [];
		archetypeDecks.forEach(d => {
			const deck = Object.assign({}, d);
			deck.playerClass = playerClass;
			const cards = JSON.parse(deck["deck_list"]).map(c => {
				return { card: cardData.fromDbf(c[0]), count: c[1] };
			});
			if (
				this.props.gameType === "RANKED_STANDARD" &&
				cards.some(c => isWildSet(c.card.set))
			) {
				return;
			}
			decks.push({
				archetypeId: deck.archetype_id,
				cards,
				deckId: deck["deck_id"],
				duration: +deck["avg_game_length_seconds"],
				numGames: +deck["total_games"],
				playerClass: deck["playerClass"],
				winrate: +deck["win_rate"],
			});
		});
		this.setState({ popularDecks: decks });
	}

	public componentWillReceiveProps(
		nextProps: Readonly<Props>,
		nextContext: any,
	): void {
		if (
			this.getGameType() !== nextProps.gameType ||
			this.props.rankRange !== nextProps.rankRange
		) {
			this.fetchDeckData(nextProps);
		}
		if (!this.props.cardData && nextProps.cardData) {
			this.updateData(nextProps.cardData);
		}
	}

	public render(): React.ReactNode {
		const gameType = this.getGameType();
		const { GameType, RankRange, archetype_id } = {
			GameType: gameType,
			RankRange: this.props.rankRange,
			archetype_id: this.props.archetypeId,
		};
		const chartParams = { GameType, RankRange, archetype_id };
		const params = { GameType, RankRange };

		let content = null;
		if (this.hasData()) {
			content = [
				<section id="content-header">
					<div className="container-fluid">
						<div className="row">
							<DataInjector
								query={[
									{
										key: "chartData",
										url: "single_archetype_stats_over_time",
										params: chartParams,
									},
									{
										key: "matchupData",
										params,
										url: "head_to_head_archetype_matchups",
									},
								]}
								extract={{
									matchupData: this.extractMatchupData,
									chartData: this.trimChartData("chartData"),
								}}
							>
								<WinrateBox
									href="#tab=overtime"
									onClick={() =>
										this.props.setTab("overtime")
									}
								/>
							</DataInjector>
							<DataInjector
								query={[
									{
										key: "chartData",
										url: "single_archetype_stats_over_time",
										params: chartParams,
									},
									{
										key: "popularityData",
										params,
										url:
											"archetype_popularity_distribution_stats",
									},
								]}
								extract={{
									popularityData: this.extractPopularityData,
									chartData: this.trimChartData("chartData"),
								}}
							>
								<PopularityBox
									href="#tab=overtime"
									onClick={() =>
										this.props.setTab("overtime")
									}
									playerClass={this.props.playerClass}
								/>
							</DataInjector>
							<DataInjector
								query={[
									{
										key: "matchupData",
										params,
										url: "head_to_head_archetype_matchups",
									},
									{
										key: "archetypeData",
										params: {},
										url: "/api/v1/archetypes/",
									},
								]}
								extract={{
									matchupData: this.matchupTileExtractor(
										true,
									),
								}}
							>
								<MatchupBox title="Best Matchup" />
							</DataInjector>
							<DataInjector
								query={[
									{
										key: "matchupData",
										params,
										url: "head_to_head_archetype_matchups",
									},
									{
										key: "archetypeData",
										params: {},
										url: "/api/v1/archetypes/",
									},
								]}
								extract={{
									matchupData: this.matchupTileExtractor(
										false,
									),
								}}
							>
								<MatchupBox title="Worst Matchup" />
							</DataInjector>
							<DataInjector
								query={[
									{
										key: "deckData",
										params,
										url: "list_decks_by_win_rate",
									},
									{
										key: "archetypeData",
										params: {},
										url:
											"/api/v1/archetypes/" +
											this.props.archetypeId,
									},
								]}
								extract={{
									deckData: this.deckTileExtractor(
										"total_games",
									),
								}}
							>
								<DeckBox title="Most popular deck" />
							</DataInjector>
							<DataInjector
								query={[
									{
										key: "deckData",
										params,
										url: "list_decks_by_win_rate",
									},
									{
										key: "archetypeData",
										params: {},
										url:
											"/api/v1/archetypes/" +
											this.props.archetypeId,
									},
								]}
								extract={{
									deckData: this.deckTileExtractor(
										"win_rate",
									),
								}}
							>
								<DeckBox title="Best performing deck" />
							</DataInjector>
						</div>
					</div>
				</section>,
				<section id="page-content">
					<TabList tab={this.props.tab} setTab={this.props.setTab}>
						<Tab label="Overview" id="overview">
							<div className="col-lg-8 col-md-6 col-sm-12 col-xs-12">
								<DataInjector
									query={{
										key: "data",
										params: {},
										url:
											"/api/v1/archetypes/" +
											this.props.archetypeId,
									}}
									extract={{
										data: data =>
											extractSignature(data, gameType),
									}}
								>
									<ArchetypeSignature
										cardData={this.props.cardData}
									/>
								</DataInjector>
							</div>
							<div className="col-lg-4 col-md-6 col-sm-12 col-xs-12">
								<div className="archetype-chart">
									<DataInjector
										query={[
											{
												key: "matchupData",
												params,
												url:
													"archetype_popularity_distribution_stats",
											},
											{
												key: "archetypeData",
												params: {},
												url: "/api/v1/archetypes/",
											},
										]}
									>
										<ChartLoading
											dataKeys={[
												"matchupData",
												"archetypeData",
											]}
											noDataCondition={data => !data}
										>
											<ArchetypeDistributionPieChart
												playerClass={
													this.props.playerClass
												}
												selectedArchetypeId={
													this.props.archetypeId
												}
											/>
										</ChartLoading>
									</DataInjector>
								</div>
							</div>
						</Tab>
						<Tab
							label={
								<span className="text-premium">
									Mulligan Guide&nbsp;
									<InfoIcon
										header="Archetype Mulligan Guide"
										content="See how the various cards perform in this archetype."
									/>
								</span>
							}
							id="mulligan-guide"
						>
							{this.renderMulliganGuide(params)}
						</Tab>
						<Tab label="Matchups" id="matchups">
							<DataInjector
								query={[
									{
										key: "archetypeMatchupData",
										params,
										url: "head_to_head_archetype_matchups",
									},
									{
										key: "archetypeData",
										params: {},
										url: "/api/v1/archetypes/",
									},
								]}
								extract={{
									archetypeMatchupData: data => ({
										archetypeMatchupData:
											data.series.data[
												"" + this.props.archetypeId
											],
									}),
								}}
							>
								<ArchetypeMatchups
									archetypeId={this.props.archetypeId}
									cardData={this.props.cardData}
									minGames={100}
								/>
							</DataInjector>
						</Tab>
						<Tab label="Popular Decks" id="similar">
							<DeckList
								decks={this.state.popularDecks}
								pageSize={10}
								hideTopPager
								sortBy={this.state.popularDecksSortBy}
								sortDirection={
									this.state.popularDecksSortDirection
								}
								setSortBy={sortBy =>
									this.setState({
										popularDecksSortBy: sortBy,
									})
								}
								setSortDirection={sortDirection =>
									this.setState({
										popularDecksSortDirection: sortDirection,
									})
								}
								page={this.state.popularDecksPage}
								setPage={page =>
									this.setState({ popularDecksPage: page })
								}
								collection={this.props.collection}
							/>
						</Tab>
						<Tab label="Over Time" id="overtime">
							<div className="over-time-chart">
								<AutoSizer>
									{({ width }) => (
										<div>
											<DataInjector
												query={{
													url:
														"single_archetype_stats_over_time",
													params: chartParams,
												}}
												extract={{
													data: this.trimChartData(
														"data",
													),
												}}
											>
												<ChartLoading>
													<PopularityLineChart
														maxYDomain={10}
														width={width}
														height={300}
														absolute
													/>
												</ChartLoading>
											</DataInjector>
											<InfoIcon
												header="Popularity over time"
												content="Percentage of all decks that are classified as this archetype."
											/>
										</div>
									)}
								</AutoSizer>
							</div>
							<div className="over-time-chart">
								<AutoSizer>
									{({ width }) => (
										<div>
											<DataInjector
												query={{
													url:
														"single_archetype_stats_over_time",
													params: chartParams,
												}}
												extract={{
													data: this.trimChartData(
														"data",
													),
												}}
											>
												<ChartLoading>
													<WinrateLineChart
														width={width}
														height={300}
														absolute
													/>
												</ChartLoading>
											</DataInjector>
											<InfoIcon
												header="Winrate over time"
												content="Percentage of games won with this archetype."
											/>
										</div>
									)}
								</AutoSizer>
							</div>
						</Tab>
					</TabList>
				</section>,
			];
		} else {
			content = <h3 className="message-wrapper">No data available</h3>;
		}

		return (
			<div className="archetype-detail-container">
				<aside className="infobox">
					<h1>{this.props.archetypeName}</h1>
					<img
						className="hero-image"
						src={getHeroSkinCardUrl(this.props.playerClass)}
					/>
					<section id="rank-range-filter">
						<InfoboxFilterGroup
							header="Rank Range"
							infoHeader="Archetype by rank"
							infoContent="Check out how this archetype performs at various rank ranges!"
							selectedValue={this.props.rankRange}
							onClick={value => this.props.setRankRange(value)}
						>
							<PremiumWrapper
								name="Archetype Detail Rank Range"
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
							<InfoboxFilter value="LEGEND_THROUGH_TWENTY">
								Legend–20
							</InfoboxFilter>
						</InfoboxFilterGroup>
					</section>
					<section id="info">
						<h2>Data</h2>
						<ul>
							<li>
								Game Type
								<span className="infobox-value">
									Ranked Standard
								</span>
							</li>
							<li>
								Time Frame
								<span className="infobox-value">
									Last 7 days
								</span>
							</li>
						</ul>
					</section>
				</aside>
				<main>{content}</main>
			</div>
		);
	}

	getGameType(props?: Props): string {
		const { gameType, hasWildData, hasStandardData } = props || this.props;
		if (!hasStandardData && !hasWildData) {
			return "RANKED_STANDARD";
		}
		if (
			(gameType === "RANKED_WILD" && hasWildData) ||
			(gameType === "RANKED_STANDARD" && !hasStandardData)
		) {
			return "RANKED_WILD";
		}
		return "RANKED_STANDARD";
	}

	// Trim chart data points to latest set rotation
	trimChartData(key: string) {
		const trim = series => {
			if (!series) {
				return;
			}
			series.data = series.data.filter(d => {
				return new Date(d.x) >= new Date(2018, 3, 12);
			});
		};

		return chartData => {
			if (this.props.gameType === "RANKED_STANDARD") {
				trim(
					chartData.series.find(
						x => x.name === "popularity_over_time",
					),
				);
				trim(
					chartData.series.find(x => x.name === "winrates_over_time"),
				);
			}
			const obj = {};
			obj[key] = chartData;
			return obj;
		};
	}

	extractMatchupData = matchupData => {
		const data = matchupData.series.metadata["" + this.props.archetypeId];
		if (data) {
			return { games: data.total_games, winrate: data.win_rate };
		}
		return { status: LoadingStatus.NO_DATA };
	};

	extractPopularityData = popularityData => {
		const classData = popularityData.series.data[this.props.playerClass];
		const archetype =
			classData &&
			classData.find(a => a.archetype_id === this.props.archetypeId);
		if (archetype) {
			return { popularity: archetype.pct_of_class };
		}
		return { status: LoadingStatus.NO_DATA };
	};

	matchupTileExtractor(best: boolean) {
		return (matchupData, props) => {
			if (!props.archetypeData) {
				return;
			}
			const matchups =
				matchupData.series.data["" + this.props.archetypeId];
			if (matchups) {
				const data = Object.keys(matchups)
					.map(id => {
						const opponentData: Archetype = props.archetypeData.find(
							archetype => archetype.id === +id,
						);
						if (opponentData) {
							return {
								archetypeId: +id,
								archetypeName: opponentData.name,
								games: matchups[id].total_games,
								playerClass: opponentData.player_class_name,
								winrate: matchups[id].win_rate,
							};
						}
					})
					.filter(x => x !== undefined && x.games > 100);
				data.sort((a, b) => b.winrate - a.winrate);
				const index = best ? 0 : data.length - 1;
				return { ...data[index] };
			}
			return { status: LoadingStatus.NO_DATA };
		};
	}

	deckTileExtractor(sortProp: string) {
		return (deckData, props) => {
			const { cardData, playerClass, archetypeId } = this.props;
			const gameType = this.getGameType();

			if (!cardData || !props.archetypeData) {
				return { status: LoadingStatus.NO_DATA };
			}
			const classDecks = deckData.series.data[playerClass];
			if (!classDecks) {
				return { status: LoadingStatus.NO_DATA };
			}
			const signatureData = extractSignature(
				props.archetypeData,
				gameType,
			);
			if (!signatureData) {
				return { status: LoadingStatus.NO_DATA };
			}

			const decks = classDecks.filter(
				deck => deck.archetype_id === archetypeId,
			);
			if (decks.length > 0) {
				decks.sort((a, b) => {
					return (
						b[sortProp] - a[sortProp] ||
						(a.deck_id > b.deck_id ? 1 : -1)
					);
				});
				const components = signatureData.signature.components;
				if (!components) {
					return { status: LoadingStatus.NO_DATA };
				}
				const prevalences = components
					.slice()
					.map(([dbfId, prevalence]) => {
						return { card: cardData.fromDbf(dbfId), prevalence };
					})
					.sort((a, b) => {
						return (
							a.prevalence - b.prevalence ||
							(a.card.name > b.card.name ? 1 : -1)
						);
					});
				const deckCards = JSON.parse(decks[0].deck_list).map(c => c[0]);
				const dbfIds = [];
				prevalences.forEach(({ card }) => {
					if (
						deckCards.indexOf(card.dbfId) !== -1 &&
						dbfIds.length < 4
					) {
						dbfIds.push(card.dbfId);
					}
				});
				const cards = dbfIds.map(dbfId => cardData.fromDbf(dbfId));
				return {
					cards,
					deckId: decks[0].deck_id,
					games: decks[0].total_games,
					winrate: decks[0].win_rate,
				};
			}
			return { status: LoadingStatus.NO_DATA };
		};
	}

	renderMulliganGuide(params) {
		const { cardData } = this.props;

		if (!cardData) {
			return null;
		}

		if (!UserData.isPremium()) {
			return (
				<PremiumPromo
					imageName="archetype_mulligan_guide.png"
					text={
						"View the combined Mulligan Guide using data from all decks for this archetype."
					}
				/>
			);
		}

		return (
			<DataInjector
				query={[
					{
						key: "mulliganData",
						params: {
							GameType: this.getGameType(),
							RankRange: this.props.rankRange,
							archetype_id: this.props.archetypeId,
						},
						url: "single_archetype_mulligan_guide",
					},
					{
						key: "matchupData",
						params,
						url: "head_to_head_archetype_matchups",
					},
				]}
				extract={{
					mulliganData: data => ({
						data: data.series.data["ALL"],
						cards: data.series.data["ALL"]
							.filter(row => row.rank <= 40)
							.map(row => ({
								card: cardData.fromDbf(row.dbf_id),
								count: 1,
							})),
					}),
					matchupData: matchupData => {
						const data =
							matchupData.series.metadata[
								"" + this.props.archetypeId
							];
						if (data) {
							return { baseWinrate: data.win_rate };
						}
						return { status: LoadingStatus.NO_DATA };
					},
				}}
			>
				<CardTable
					columns={[
						"mulliganWinrate",
						"keepPercent",
						"drawnWinrate",
						"playedWinrate",
						"turnsInHand",
						"turnPlayed",
					]}
					onSortChanged={(
						sortBy: string,
						sortDirection: SortDirection,
					) => {
						this.setState({
							mulliganGuideSortBy: sortBy,
							mulliganGuideSortDirection: sortDirection,
						});
					}}
					sortBy={this.state.mulliganGuideSortBy}
					sortDirection={
						this.state.mulliganGuideSortDirection as SortDirection
					}
					collection={this.props.collection}
				/>
			</DataInjector>
		);
	}
}
