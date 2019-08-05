import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import CardData from "../CardData";
import AdaptDetail from "../components/carddetail/AdaptDetail";
import RecommendedDecksList from "../components/carddetail/RecommendedDecksList";
import CardRankingTable from "../components/CardRankingTable";
import CardDetailPieChart from "../components/charts/CardDetailPieChart";
import PopularityLineChart from "../components/charts/PopularityLineChart";
import TurnPlayedBarChart from "../components/charts/TurnPlayedBarChart";
import WinrateByTurnLineChart from "../components/charts/WinrateByTurnLineChart";
import WinrateLineChart from "../components/charts/WinrateLineChart";
import ClassFilter, { FilterOption } from "../components/ClassFilter";
import DataInjector from "../components/DataInjector";
import DataText from "../components/DataText";
import Fragments from "../components/Fragments";
import InfoboxFilter from "../components/InfoboxFilter";
import InfoboxFilterGroup from "../components/InfoboxFilterGroup";
import InfoboxLastUpdated from "../components/InfoboxLastUpdated";
import InfoIcon from "../components/InfoIcon";
import Tab from "../components/layout/Tab";
import TabList from "../components/layout/TabList";
import ChartLoading from "../components/loading/ChartLoading";
import HideLoading from "../components/loading/HideLoading";
import TableLoading from "../components/loading/TableLoading";
import LoadingSpinner from "../components/LoadingSpinner";
import PremiumWrapper from "../components/premium/PremiumWrapper";
import PrettyCardClass from "../components/text/PrettyCardClass";
import PrettyRankRange from "../components/text/PrettyRankRange";
import PrettyTimeRange from "../components/text/PrettyTimeRange";
import { RankRange, TimeRange } from "../filters";
import {
	getChartScheme,
	getDustCost,
	getHeroClassName,
	isArenaOnlyCard,
	isArenaSet,
	isCollectibleCard,
	isWildSet,
	toPrettyNumber,
} from "../helpers";
import { I18N_NAMESPACE_HEARTHSTONE } from "../i18n";
import { RenderData, TableData } from "../interfaces";
import UserData from "../UserData";
import { Collection } from "../utils/api";
import NetworkNAdUnit, {
	refreshAdUnits,
} from "../components/ads/NetworkNAdUnit";
import Sticky from "../components/utils/Sticky";

interface Props extends WithTranslation {
	card: any;
	cardData: CardData;
	cardId: string;
	dbfId: number;
	collection: Collection | null;
	gameType?: string;
	opponentClass?: string;
	rankRange?: string;
	setGameType?: (gameType: string) => void;
	setOpponentClass?: (opponentClass: string) => void;
	setRankRange?: (rankRange: string) => void;
	setTab?: (tab: string) => void;
	tab?: string;
}

interface State {
	showInfo?: boolean;
}

class CardDetail extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			showInfo: false,
		};
	}

	cardHasTargetReqs(): boolean {
		const targetRequirements = [
			"REQ_TARGET_TO_PLAY",
			"REQ_TARGET_FOR_COMBO",
			"REQ_TARGET_IF_AVAILABLE",
			"REQ_TARGET_IF_AVAILABE_AND_ELEMENTAL_PLAYED_LAST_TURN", // [sic]
			"REQ_TARGET_IF_AVAILABLE_AND_DRAGON_IN_HAND",
			"REQ_TARGET_IF_AVAILABLE_AND_MINIMUM_FRIENDLY_MINIONS",
		];
		if (this.props.card && this.props.card.playRequirements) {
			const cardRequirements = Object.keys(
				this.props.card.playRequirements,
			);
			for (const targetReq of targetRequirements) {
				if (cardRequirements.indexOf(targetReq) !== -1) {
					return true;
				}
			}
		}
		return false;
	}

	cardHasDiscover(): boolean {
		if (!this.props.card) {
			return false;
		}
		const hasDiscover =
			(this.props.card.referencedTags &&
				this.props.card.referencedTags.some(t => t === "DISCOVER")) ||
			(this.props.card.mechanics &&
				this.props.card.mechanics.some(t => t === "DISCOVER"));
		const implicit = [
			41331, // Kalimos, Primal Lord
			43329, // Kobold Hermit
			46305, // The Runespear
		];
		return hasDiscover || implicit.indexOf(this.props.dbfId) !== -1;
	}

	cardIsNeutral(): boolean {
		return (
			(this.props.card && this.props.card.cardClass === "NEUTRAL") ||
			false
		);
	}

	cardHasAdapt(): boolean {
		return (
			(this.props.card &&
				this.props.card.referencedTags &&
				this.props.card.referencedTags.indexOf("ADAPT") !== -1) ||
			false
		);
	}

	cardIsQuest(): boolean {
		return (
			(this.props.card &&
				this.props.card.mechanics &&
				this.props.card.mechanics.indexOf("QUEST") !== -1) ||
			false
		);
	}

	public componentWillReceiveProps(
		nextProps: Readonly<Props>,
		nextContext: any,
	): void {
		if (!this.props.card && nextProps.card) {
			if (isWildSet(nextProps.card.set)) {
				this.props.setGameType("RANKED_WILD");
			}
		}
	}

	public componentDidUpdate(
		prevProps: Readonly<Props>,
		prevState: Readonly<State>,
		snapshot?: any,
	): void {
		if (
			prevProps.gameType !== this.props.gameType ||
			prevProps.tab !== this.props.tab
		) {
			refreshAdUnits();
		}
	}

	public render(): React.ReactNode {
		const { t } = this.props;

		const isPremium = UserData.isPremium();
		let content = null;
		if (this.props.card) {
			if (
				!isCollectibleCard(this.props.card) &&
				!isArenaOnlyCard(this.props.card)
			) {
				content = (
					<div className="message-wrapper">
						<h3>
							{t(
								"Sorry, we currently don't have statistics for non-collectible cards.",
							)}
						</h3>
						<a href="/cards/" className="promo-button">
							{t("Show available cards")}
						</a>
					</div>
				);
			} else {
				let utilization = [];
				const cardStatsLoading = false;

				if (utilization.length) {
					const colWidth = 12 / utilization.length;
					utilization = utilization.map(obj => (
						<div
							className={`col-lg-${colWidth} col-md-${colWidth}`}
						>
							{obj}
						</div>
					));
				} else if (cardStatsLoading) {
					utilization.push(
						<h3 className="message-wrapper">
							<LoadingSpinner active />
						</h3>,
					);
				} else {
					utilization.push(
						<h3 className="message-wrapper">
							{t("No utilization data for this card available")}
						</h3>,
					);
				}

				const headerContent = (
					<>
						<div className="col-lg-6 col-md-6">
							<div className="chart-wrapper">
								<DataInjector
									query={{
										url: "single_card_stats_over_time",
										params: this.getParams(),
									}}
								>
									<ChartLoading>
										<PopularityLineChart
											widthRatio={2}
											maxYDomain={100}
										/>
									</ChartLoading>
								</DataInjector>
								<InfoIcon
									header={t("Popularity over time")}
									content={t(
										"Percentage of decks that include at least one copy of this card.",
									)}
								/>
							</div>
						</div>
						<div className="col-lg-6 col-md-6">
							<div className="chart-wrapper">
								<DataInjector
									query={{
										url: "single_card_stats_over_time",
										params: this.getParams(),
									}}
								>
									<ChartLoading>
										<WinrateLineChart
											widthRatio={2}
											axisLabelY={t("Deck winrate")}
										/>
									</ChartLoading>
								</DataInjector>
								<InfoIcon
									header={t("Winrate over time")}
									content={t(
										"Winrate of decks that include at least one copy of this card.",
									)}
								/>
							</div>
						</div>
					</>
				);

				const turnStatsQuery = {
					params: this.getParams(),
					url:
						this.props.opponentClass !== "ALL"
							? "/analytics/query/single_card_stats_by_turn_and_opponent"
							: "/analytics/query/single_card_stats_by_turn",
				};

				const turnStatsNoDataCondition = (
					data: RenderData,
				): boolean => {
					if (this.props.opponentClass !== "ALL" && isPremium) {
						const selectedSeries = data.series.find(
							s =>
								s.metadata.opponent_class ===
								this.props.opponentClass,
						);
						return (
							!selectedSeries || selectedSeries.data.length < 2
						);
					}
					return data.series[0].data.length < 2;
				};

				const turnPlayedChart = (
					<TurnPlayedBarChart
						opponentClass={this.props.opponentClass}
						widthRatio={2}
						premiumLocked={!isPremium}
					/>
				);

				const winrateByTurnChart = (
					<WinrateByTurnLineChart
						opponentClass={this.props.opponentClass}
						widthRatio={2}
						premiumLocked={!isPremium}
					/>
				);

				const turnCharts = (
					<div className="container-fluid">
						<div className="row">
							<div className="opponent-filter-wrapper">
								<h3>{t("Opponent class")}</h3>
								<ClassFilter
									filters="All"
									hideAll
									minimal
									selectedClasses={[
										this.props
											.opponentClass as FilterOption,
									]}
									selectionChanged={selected =>
										isPremium &&
										this.props.setOpponentClass(selected[0])
									}
								/>
							</div>
						</div>
						<div className="row">
							<div className="col-lg-6 col-md-6">
								<div className="chart-wrapper">
									{isPremium ? (
										<DataInjector query={turnStatsQuery}>
											<ChartLoading
												noDataCondition={
													turnStatsNoDataCondition
												}
											>
												{turnPlayedChart}
											</ChartLoading>
										</DataInjector>
									) : (
										turnPlayedChart
									)}
									<InfoIcon
										header={t("Popularity by turn")}
										content={t(
											"Percentage of the time this card is played on a given turn.",
										)}
									/>
								</div>
							</div>
							<div className="col-lg-6 col-md-6">
								<div className="chart-wrapper">
									{isPremium ? (
										<DataInjector query={turnStatsQuery}>
											<ChartLoading
												noDataCondition={
													turnStatsNoDataCondition
												}
											>
												{winrateByTurnChart}
											</ChartLoading>
										</DataInjector>
									) : (
										winrateByTurnChart
									)}
									<InfoIcon
										header={t("Winrate by turn")}
										content={t(
											"Percentage of games won when this card is played on a given turn.",
										)}
									/>
								</div>
							</div>
						</div>
					</div>
				);

				content = (
					<>
						<Sticky top={10}>
							<NetworkNAdUnit
								id="nn_lb1"
								uniqueId="cd-bb1"
								center
							/>
						</Sticky>
						<section id="content-header" key="content-header">
							<h1>
								{t("{cardName} – Statistics", {
									cardName: this.props.card.name,
								})}
							</h1>
							{headerContent}
							<NetworkNAdUnit
								id="nn_mobile_mpu2"
								uniqueId="cd-mmpu2"
								mobile
								center
							/>
						</section>
						<section id="page-content" key="page-content">
							<Fragments
								defaults={{
									tab: "",
								}}
								keepDefaults
							>
								<TabList
									tab={this.props.tab}
									setTab={this.props.setTab}
								>
									<Tab
										label={t("Recommended Decks")}
										id="recommended-decks"
										disabled={this.isArena()}
									>
										<DataInjector
											query={{
												params: {
													GameType: this.props
														.gameType,
													RankRange: this.props
														.rankRange,
												},
												url: "list_decks_by_win_rate",
											}}
										>
											<TableLoading>
												<RecommendedDecksList
													card={this.props.card}
													cardData={
														this.props.cardData
													}
													collection={
														this.props.collection
													}
												/>
											</TableLoading>
										</DataInjector>
									</Tab>
									<Tab
										label={
											<span className="text-premium">
												{t("Turn Details")}
												<InfoIcon
													header={t(
														"Popularity and Winrate by turn",
													)}
													content={t(
														"Learn when this card is usually played in the different matchups and how that affects the winrate.",
													)}
												/>
											</span>
										}
										id="turn-statistics"
										premiumModalOnClick="CardTurn"
									>
										<PremiumWrapper
											analyticsLabel="Single Card Turn Statistics"
											iconStyle={{ display: "none" }}
											modalStyle="CardTurn"
										>
											{turnCharts}
										</PremiumWrapper>
									</Tab>
									<Tab
										label={t("Class distribution")}
										id="class-distribution"
										hidden={!this.cardIsNeutral()}
									>
										<h3>{t("Class Distribution")}</h3>
										<div id="class-chart">
											<DataInjector
												query={{
													url:
														"single_card_class_distribution_by_include_count",
													params: this.getParams(),
												}}
											>
												<ChartLoading>
													<CardDetailPieChart
														removeEmpty
														scheme={getChartScheme(
															"class",
															t,
														)}
														sortByValue
														groupSparseData
														percentage
														formatLabel={label =>
															getHeroClassName(
																label,
																t,
															)
														}
													/>
												</ChartLoading>
											</DataInjector>
										</div>
									</Tab>
									<Tab
										label={t("Targets")}
										id="targets"
										hidden={!this.cardHasTargetReqs()}
									>
										<div className="card-tables">
											<h3>{t("Most popular targets")}</h3>
											<DataInjector
												query={{
													url:
														"single_card_popular_targets",
													params: this.getParams(),
												}}
												modify={data =>
													this.mergeHeroes(data)
												}
											>
												<TableLoading>
													<CardRankingTable
														cardData={
															this.props.cardData
														}
														numRows={12}
														dataKey={"ALL"}
													/>
												</TableLoading>
											</DataInjector>
										</div>
									</Tab>
									<Tab
										label={t("GLOBAL_KEYWORD_DISCOVER", {
											ns: I18N_NAMESPACE_HEARTHSTONE,
										})}
										id="discover"
										hidden={!this.cardHasDiscover()}
									>
										<div className="card-tables">
											<h3>
												{t(
													"Most popular Discover choices",
												)}
											</h3>
											<DataInjector
												query={{
													url:
														"single_card_choices_by_winrate",
													params: this.getParams(),
												}}
											>
												<TableLoading>
													<CardRankingTable
														cardData={
															this.props.cardData
														}
														numRows={12}
														dataKey={"ALL"}
														tooltips={{
															popularity: (
																<InfoIcon
																	header={t(
																		"Popularity for Discover",
																	)}
																	content={t(
																		"A card's percentage represents how often the card was picked over others if it was available for choice.",
																	)}
																/>
															),
														}}
													/>
												</TableLoading>
											</DataInjector>
										</div>
									</Tab>
									<Tab
										label={t("Adapt")}
										id="adapt"
										hidden={!this.cardHasAdapt()}
									>
										<DataInjector
											query={{
												params: this.getParams(),
												url:
													isPremium &&
													this.props.opponentClass !==
														"ALL"
														? "single_card_adapt_stats_by_opponent"
														: "single_card_adapt_stats",
											}}
										>
											<AdaptDetail
												cardData={this.props.cardData}
												opponentClass={
													this.props.opponentClass
												}
												setOpponentClass={
													this.props.setOpponentClass
												}
											/>
										</DataInjector>
									</Tab>
								</TabList>
							</Fragments>
						</section>
					</>
				);
			}
		} else {
			content = (
				<h3 className="message-wrapper">
					<LoadingSpinner active />
				</h3>
			);
		}

		let tribe = null;
		if (this.props.card && this.props.card.race) {
			tribe = (
				<li>
					{t("Tribe")}
					<span className="infobox-value">
						{t(`GLOBAL_RACE_${this.props.card.race}`, {
							ns: I18N_NAMESPACE_HEARTHSTONE,
						})}
					</span>
				</li>
			);
		}

		const dustCost = getDustCost(this.props.card);
		const craftingCost = (
			<li>
				{t("GLOBAL_COST")}
				{this.props.card ? (
					<span className="infobox-value">
						{dustCost > 0
							? t("{dustCost} Dust", { dustCost })
							: t("Not craftable")}
					</span>
				) : null}
			</li>
		);
		const hearthstoneLang = UserData.getHearthstoneLocale();

		return (
			<div className="card-detail-container">
				<NetworkNAdUnit
					id="nn_mobile_lb1_sticky"
					uniqueId="cd-mlb1"
					mobile
				/>
				<aside className="infobox" id="card-detail-infobox">
					<h1 className="art">
						<img
							className="card-image"
							src={`${HEARTHSTONE_ART_URL}/render/latest/${hearthstoneLang}/512x/${
								this.props.cardId
							}.png`}
							alt={
								(this.props.card && this.props.card.name) || ""
							}
						/>
					</h1>
					<p>{this.getCleanFlavorText()}</p>
					<NetworkNAdUnit
						id="nn_mobile_mpu1"
						uniqueId="cd-mmpu1"
						mobile
						center
					/>
					<InfoboxFilterGroup
						header={t("Game mode")}
						selectedValue={this.props.gameType}
						onClick={value => this.props.setGameType(value)}
					>
						<InfoboxFilter
							disabled={
								this.props.card &&
								(isWildSet(this.props.card.set) ||
									isArenaOnlyCard(this.props.card))
							}
							value="RANKED_STANDARD"
						>
							{t("Ranked Standard")}
						</InfoboxFilter>
						<InfoboxFilter
							value="RANKED_WILD"
							disabled={
								this.props.card &&
								isArenaOnlyCard(this.props.card)
							}
						>
							{t("Ranked Wild")}
						</InfoboxFilter>
						<InfoboxFilter
							disabled={
								(this.props.card &&
									!isArenaSet(this.props.card.set)) ||
								this.cardIsQuest()
							}
							value="ARENA"
						>
							{t("Arena")}
						</InfoboxFilter>
					</InfoboxFilterGroup>
					{!this.props.card || !isArenaOnlyCard(this.props.card) ? (
						<InfoboxFilterGroup
							header={t("Rank range")}
							infoHeader={t("Rank range")}
							infoContent={t(
								"Check out how this card performs at higher ranks!",
							)}
							selectedValue={
								!this.isArena() && this.props.rankRange
							}
							onClick={value => this.props.setRankRange(value)}
							disabled={this.isArena()}
						>
							<PremiumWrapper
								analyticsLabel="Single Card Rank Range"
								iconStyle={{ display: "none" }}
								modalStyle="TimeRankRegion"
							>
								<InfoboxFilter value={RankRange.LEGEND_ONLY}>
									<PrettyRankRange
										rankRange={RankRange.LEGEND_ONLY}
									/>
								</InfoboxFilter>
								<InfoboxFilter
									value={RankRange.LEGEND_THROUGH_FIVE}
								>
									<PrettyRankRange
										rankRange={
											RankRange.LEGEND_THROUGH_FIVE
										}
									/>
								</InfoboxFilter>
								<InfoboxFilter
									value={RankRange.LEGEND_THROUGH_TEN}
								>
									<PrettyRankRange
										rankRange={RankRange.LEGEND_THROUGH_TEN}
									/>
								</InfoboxFilter>
							</PremiumWrapper>
							<InfoboxFilter value={RankRange.ALL}>
								<PrettyRankRange rankRange={RankRange.ALL} />
							</InfoboxFilter>
						</InfoboxFilterGroup>
					) : null}
					<h2>{t("Data")}</h2>
					<ul>
						<li>
							{t("Sample size")}
							<span className="infobox-value">
								<DataInjector
									fetchCondition={
										!!this.props.card &&
										isCollectibleCard(this.props.card)
									}
									query={{
										url: "single_card_stats_over_time",
										params: this.getParams(),
									}}
									modify={data => {
										if (data) {
											const series = data.series.find(
												x => x.metadata.is_winrate_data,
											);
											const numReplays = toPrettyNumber(
												series.metadata.num_data_points,
											);
											return t("{numReplays} replays", {
												numReplays,
											});
										}
										return null;
									}}
								>
									<HideLoading>
										<DataText />
									</HideLoading>
								</DataInjector>
							</span>
						</li>
						<li>
							{t("Time frame")}
							<span className="infobox-value">
								<PrettyTimeRange
									timeRange={TimeRange.LAST_30_DAYS}
								/>
							</span>
						</li>
						<InfoboxLastUpdated
							fetchCondition={
								!!this.props.card &&
								isCollectibleCard(this.props.card)
							}
							url={"single_card_stats_over_time"}
							params={this.getParams()}
						/>
					</ul>
					<h2>{t("Card")}</h2>
					<ul>
						<li>
							{t("Class")}
							<span className="infobox-value">
								{this.props.card ? (
									<PrettyCardClass
										cardClass={this.props.card.cardClass}
									/>
								) : null}
							</span>
						</li>
						<li>
							{t("Type")}
							<span className="infobox-value">
								{this.props.card &&
									t(
										`GLOBAL_CARDTYPE_${
											this.props.card.type
										}`,
										{ ns: I18N_NAMESPACE_HEARTHSTONE },
									)}
							</span>
						</li>
						{this.props.card && this.props.card.rarity ? (
							<li>
								{t("Rarity")}
								<span className="infobox-value">
									{this.props.card &&
										t(
											`GLOBAL_RARITY_${
												this.props.card.rarity
											}`,
											{ ns: I18N_NAMESPACE_HEARTHSTONE },
										)}
								</span>
							</li>
						) : null}
						<li>
							{t("Set")}
							<span className="infobox-value">
								{this.props.card &&
									t(
										`GLOBAL_CARD_SET_${
											this.props.card.set
										}`,
										{ ns: I18N_NAMESPACE_HEARTHSTONE },
									)}
							</span>
						</li>
						{tribe}
						{craftingCost}
						<li>
							{t("Artist")}
							<span className="infobox-value">
								{(this.props.card && this.props.card.artist) ||
									t("Unknown")}
							</span>
						</li>
					</ul>
					<Sticky bottom={0}>
						<NetworkNAdUnit id="nn_mpu1" uniqueId="cd-mpu1" />
					</Sticky>
				</aside>
				<main>{content}</main>
			</div>
		);
	}

	isArena(): boolean {
		return this.props.gameType === "ARENA";
	}

	mergeHeroes(tableData: TableData): TableData {
		if (!this.props.cardData) {
			return tableData;
		}
		const all = [];
		const hero = { dbf_id: -1, popularity: 0, is_opponent_hero: true };
		tableData.series.data.ALL.forEach(x => {
			const card =
				x.dbf_id !== -1 ? this.props.cardData.fromDbf(x.dbf_id) : null;
			if (card && card.type === "HERO") {
				hero.popularity += +x.popularity;
			} else {
				all.push(x);
			}
		});
		all.push(hero);
		return { series: { data: { ALL: all } } };
	}

	getCleanFlavorText(): string {
		if (!this.props.card || !this.props.card.flavor) {
			return null;
		}
		return this.props.card.flavor
			.replace(new RegExp("</?i>", "g"), "")
			.replace(new RegExp("_", "g"), "\xa0");
	}

	getParams(): any {
		const params = {
			GameType: this.props.gameType,
			card_id: this.props.dbfId,
		};
		if (!this.isArena()) {
			params["RankRange"] = this.props.rankRange;
		}
		return params;
	}
}

export default withTranslation()(CardDetail);
