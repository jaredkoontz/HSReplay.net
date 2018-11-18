import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import { AutoSizer } from "react-virtualized";
import CardData from "../CardData";
import DataManager from "../DataManager";
import UserData from "../UserData";
import DataInjector from "../components/DataInjector";
import DeckList from "../components/DeckList";
import InfoIcon from "../components/InfoIcon";
import InfoboxFilter from "../components/InfoboxFilter";
import InfoboxFilterGroup from "../components/InfoboxFilterGroup";
import ArchetypeDistributionPieChart from "../components/archetypedetail/ArchetypeDistributionPieChart";
import ArchetypeImage from "../components/archetypedetail/ArchetypeImage";
import ArchetypeMatchups from "../components/archetypedetail/ArchetypeMatchups";
import ArchetypeSignature from "../components/archetypedetail/ArchetypeSignature";
import DeckBox from "../components/box/DeckBox";
import MatchupBox from "../components/box/MatchupBox";
import PopularityBox from "../components/box/PopularityBox";
import WinrateBox from "../components/box/WinrateBox";
import PopularityLineChart from "../components/charts/PopularityLineChart";
import WinrateLineChart from "../components/charts/WinrateLineChart";
import Tab from "../components/layout/Tab";
import TabList from "../components/layout/TabList";
import ChartLoading from "../components/loading/ChartLoading";
import PremiumPromo from "../components/premium/PremiumPromo";
import PremiumWrapper from "../components/premium/PremiumWrapper";
import CardTable from "../components/tables/CardTable";
import PrettyRankRange from "../components/text/PrettyRankRange";
import PrettyTimeRange from "../components/text/PrettyTimeRange";
import { extractSignature } from "../extractors";
import {
	RankRange as RankRangeFilter,
	TimeRange as TimeRangeFilter,
} from "../filters";
import { isWildSet } from "../helpers";
import { DeckObj, LoadingStatus, SortDirection } from "../interfaces";
import { Archetype, Collection } from "../utils/api";
import AdContainer from "../components/ads/AdContainer";
import AdUnit from "../components/ads/AdUnit";
import TwitchVods from "../components/TwitchVods";

interface Props extends InjectedTranslateProps {
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

class ArchetypeDetail extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			deckData: null,
			mulliganGuideSortBy: "card",
			mulliganGuideSortDirection: "ascending",
			popularDecks: [],
			popularDecksPage: 1,
			popularDecksSortBy: "popularity",
			popularDecksSortDirection: "descending",
		};
	}

	public componentDidMount(): void {
		this.fixGameTypeFragments();
		this.fetchDeckData(this.props);
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
			TimeRange: UserData.hasFeature("current-expansion-filter")
				? TimeRangeFilter.CURRENT_EXPANSION
				: TimeRangeFilter.LAST_30_DAYS,
		};
		const setDeckData = data => {
			this.setState({ deckData: data ? data.series.data : null }, () =>
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
			// temporary hotfix to hide invalid decks
			if (cards.some(card => !card.card.collectible)) {
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
		const { t } = this.props;
		const gameType = this.getGameType();
		const { GameType, RankRange, archetype_id } = {
			GameType: gameType,
			RankRange: this.props.rankRange,
			archetype_id: this.props.archetypeId,
		};
		const chartParams = { GameType, RankRange, archetype_id };
		const params = {
			GameType,
			RankRange,
			TimeRange: UserData.hasFeature("current-expansion-filter")
				? TimeRangeFilter.CURRENT_EXPANSION
				: TimeRangeFilter.LAST_7_DAYS,
		};
		const listDecksParams = {
			GameType,
			RankRange,
			TimeRange: UserData.hasFeature("current-expansion-filter")
				? TimeRangeFilter.CURRENT_EXPANSION
				: TimeRangeFilter.LAST_30_DAYS,
		};

		let content = null;
		if (this.hasData()) {
			content = (
				<>
					<section id="content-header">
						<AdContainer>
							<AdUnit id="ad-d-1" size="728x90" />
							<AdUnit id="ad-d-2" size="728x90" />
						</AdContainer>
						<div className="container-fluid">
							<div className="row">
								<DataInjector
									query={[
										{
											key: "chartData",
											url:
												"single_archetype_stats_over_time",
											params: chartParams,
										},
										{
											key: "matchupData",
											params,
											url:
												"head_to_head_archetype_matchups",
										},
									]}
									extract={{
										matchupData: this.extractMatchupData,
										chartData: this.trimChartData(
											"chartData",
										),
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
											url:
												"single_archetype_stats_over_time",
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
										popularityData: this
											.extractPopularityData,
										chartData: this.trimChartData(
											"chartData",
										),
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
											url:
												"head_to_head_archetype_matchups",
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
									<MatchupBox title={t("Best matchup")} />
								</DataInjector>
								<DataInjector
									query={[
										{
											key: "matchupData",
											params,
											url:
												"head_to_head_archetype_matchups",
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
									<MatchupBox title={t("Worst matchup")} />
								</DataInjector>
								<DataInjector
									query={[
										{
											key: "deckData",
											params: listDecksParams,
											url: "list_decks_by_win_rate",
										},
										{
											key: "archetypeData",
											params: {},
											url: `/api/v1/archetypes/${
												this.props.archetypeId
											}/`,
										},
									]}
									extract={{
										deckData: this.deckTileExtractor(
											"total_games",
										),
									}}
								>
									<DeckBox title={t("Most popular deck")} />
								</DataInjector>
								<DataInjector
									query={[
										{
											key: "deckData",
											params: listDecksParams,
											url: "list_decks_by_win_rate",
										},
										{
											key: "archetypeData",
											params: {},
											url: `/api/v1/archetypes/${
												this.props.archetypeId
											}/`,
										},
									]}
									extract={{
										deckData: this.deckTileExtractor(
											"win_rate",
										),
									}}
								>
									<DeckBox
										title={t("Best performing deck")}
									/>
								</DataInjector>
							</div>
						</div>
					</section>
					<section id="page-content">
						<TabList
							tab={this.props.tab}
							setTab={this.props.setTab}
						>
							<Tab label={t("Overview")} id="overview">
								<div className="col-lg-8 col-md-6 col-sm-12 col-xs-12">
									<DataInjector
										query={{
											key: "data",
											params: {},
											url: `/api/v1/archetypes/${
												this.props.archetypeId
											}/`,
										}}
										extract={{
											data: data =>
												extractSignature(
													data,
													gameType,
												),
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
										{t("Mulligan Guide")}
										<InfoIcon
											header={t(
												"Archetype Mulligan Guide",
											)}
											content={t(
												"See how the various cards perform in this archetype.",
											)}
										/>
									</span>
								}
								id="mulligan-guide"
								premiumModalOnClick="ArchetypeMulligan"
							>
								{this.renderMulliganGuide(params)}
							</Tab>
							<Tab label={t("Matchups")} id="matchups">
								<DataInjector
									query={[
										{
											key: "archetypeMatchupData",
											params,
											url:
												"head_to_head_archetype_matchups",
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
							<Tab label={t("Popular Decks")} id="similar">
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
										this.setState({
											popularDecksPage: page,
										})
									}
									collection={this.props.collection}
								/>
							</Tab>
							<Tab label={t("Over Time")} id="overtime">
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
													header={t(
														"Popularity over time",
													)}
													content={t(
														"Percentage of all decks that are classified as this archetype.",
													)}
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
													header={t(
														"Winrate over time",
													)}
													content={t(
														"Percentage of games won with this archetype.",
													)}
												/>
											</div>
										)}
									</AutoSizer>
								</div>
							</Tab>
							<Tab
								label={t("VODs")}
								id="vods"
								hidden={!UserData.hasFeature("twitch-vods")}
							>
								{this.renderTwitchVods()}
							</Tab>
						</TabList>
					</section>
				</>
			);
		} else {
			content = (
				<h3 className="message-wrapper">{t("No available data")}</h3>
			);
		}

		return (
			<div className="archetype-detail-container">
				<aside className="infobox">
					<DataInjector
						query={[
							{
								key: "archetypeData",
								params: {},
								url: "/api/v1/archetypes/",
							},
						]}
					>
						<ArchetypeImage
							archetypeId={this.props.archetypeId}
							cardData={this.props.cardData}
						/>
					</DataInjector>
					<section id="rank-range-filter">
						<InfoboxFilterGroup
							header={t("Rank range")}
							infoHeader={t("Archetype by rank")}
							infoContent={t(
								"Check out how this archetype performs at various rank ranges!",
							)}
							selectedValue={this.props.rankRange}
							onClick={value => this.props.setRankRange(value)}
						>
							<PremiumWrapper
								analyticsLabel="Archetype Detail Rank Range"
								iconStyle={{ display: "none" }}
								modalStyle="TimeRankRegion"
							>
								<InfoboxFilter
									value={RankRangeFilter.LEGEND_ONLY}
								>
									<PrettyRankRange
										rankRange={RankRangeFilter.LEGEND_ONLY}
									/>
								</InfoboxFilter>
								<InfoboxFilter
									value={RankRangeFilter.LEGEND_THROUGH_FIVE}
								>
									<PrettyRankRange
										rankRange={
											RankRangeFilter.LEGEND_THROUGH_FIVE
										}
									/>
								</InfoboxFilter>
								<InfoboxFilter
									value={RankRangeFilter.LEGEND_THROUGH_TEN}
								>
									<PrettyRankRange
										rankRange={
											RankRangeFilter.LEGEND_THROUGH_TEN
										}
									/>
								</InfoboxFilter>
							</PremiumWrapper>
							<InfoboxFilter
								value={RankRangeFilter.LEGEND_THROUGH_TWENTY}
							>
								<PrettyRankRange
									rankRange={
										RankRangeFilter.LEGEND_THROUGH_TWENTY
									}
								/>
							</InfoboxFilter>
						</InfoboxFilterGroup>
					</section>
					<section id="info">
						<h2>{t("Data")}</h2>
						<ul>
							<li>
								{t("Game mode")}
								<span className="infobox-value">
									{t("Ranked Standard")}
								</span>
							</li>
							<li>
								{t("Time frame")}
								<span className="infobox-value">
									<PrettyTimeRange
										timeRange={TimeRangeFilter.LAST_7_DAYS}
									/>
								</span>
							</li>
						</ul>
					</section>
					<AdUnit id="ad-d-3" size="300x250" />
					<AdUnit id="ad-d-4" size="300x250" />
					<AdUnit id="ad-d-5" size="300x250" />
				</aside>
				<main>{content}</main>
			</div>
		);
	}

	renderTwitchVods(): React.ReactNode {
		const { t } = this.props;
		return (
			<DataInjector
				query={[
					{
						key: "archetypeData",
						params: {},
						url: "/api/v1/archetypes/",
					},
					{
						key: "vods",
						params: {
							archetype_id: this.props.archetypeId,
						},
						url: "/api/v1/vods/",
					},
				]}
			>
				<TwitchVods
					customNoDataMessage={t("No VODs available")}
					cardData={this.props.cardData}
					gameType={this.getGameType()}
				/>
			</DataInjector>
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
				for (const deck of decks) {
					const deckCards = JSON.parse(deck.deck_list).map(c => c[0]);
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

					// temporary hotfix to hide invalid decks
					if (
						deckCards
							.map(dbfId => cardData.fromDbf(dbfId))
							.some(card => !card.collectible)
					) {
						continue;
					}

					return {
						cards,
						deckId: deck.deck_id,
						games: deck.total_games,
						winrate: deck.win_rate,
					};
				}
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
					text={this.props.t(
						"View the combined Mulligan Guide using data from all decks for this archetype.",
					)}
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
export default translate()(ArchetypeDetail);
