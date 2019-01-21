import _ from "lodash";
import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import AdHelper from "../AdHelper";
import CardData from "../CardData";
import AdContainer from "../components/ads/AdContainer";
import AdUnit from "../components/ads/AdUnit";
import ArchetypeImage from "../components/archetypedetail/ArchetypeImage";
import ArchetypeMatchups from "../components/archetypedetail/ArchetypeMatchups";
import CardList from "../components/CardList";
import CardDetailPieChart from "../components/charts/CardDetailPieChart";
import PopularityLineChart from "../components/charts/PopularityLineChart";
import WinrateLineChart from "../components/charts/WinrateLineChart";
import ClassFilter, { FilterOption } from "../components/ClassFilter";
import CollectionBanner from "../components/collection/CollectionBanner";
import CopyDeckButton from "../components/CopyDeckButton";
import DataInjector from "../components/DataInjector";
import DeckCountersList from "../components/deckdetail/DeckCountersList";
import DeckOverviewTable from "../components/deckdetail/DeckOverviewTable";
import DeckStats from "../components/deckdetail/DeckStats";
import SimilarDecksList from "../components/deckdetail/SimilarDecksList";
import Feature from "../components/Feature";
import InfoboxFilter from "../components/InfoboxFilter";
import InfoboxFilterGroup from "../components/InfoboxFilterGroup";
import InfoIcon from "../components/InfoIcon";
import Tab from "../components/layout/Tab";
import TabList from "../components/layout/TabList";
import ChartLoading from "../components/loading/ChartLoading";
import HideLoading from "../components/loading/HideLoading";
import TableLoading from "../components/loading/TableLoading";
import ManaCurve from "../components/ManaCurve";
import PremiumPromo from "../components/premium/PremiumPromo";
import PremiumWrapper from "../components/premium/PremiumWrapper";
import StreamList from "../components/StreamList";
import CardTable from "../components/tables/CardTable";
import PrettyCardClass from "../components/text/PrettyCardClass";
import Tooltip from "../components/Tooltip";
import DataManager from "../DataManager";
import { RankRange } from "../filters";
import {
	compareDecks,
	getArchetypeUrl,
	getHeroClassName,
	getHeroSkinCardUrl,
	image,
	isWildSet,
} from "../helpers";
import { CardObj, RenderData, SortDirection } from "../interfaces";
import { DeckEvents } from "../metrics/Events";
import UserData, { Account } from "../UserData";
import { Archetype, Collection } from "../utils/api";
import { getDustCostForCollection } from "../utils/collection";
import TwitchVods from "../components/TwitchVods";

interface InventoryGameType {
	[gameType: string]: InventoryRegion[];
}

interface InventoryRegion {
	[region: string]: string[];
}

interface Props extends InjectedTranslateProps {
	account: Account | null;
	collection: Collection | null;
	adminUrl: string;
	archetypeId?: number;
	cardData: CardData;
	deckCards: string;
	deckClass: string;
	deckId: string;
	deckName?: string;
	heroDbfId: number;
	tab?: string;
	setTab?: (tab: string) => void;
	selectedClasses?: FilterOption[];
	setSelectedClasses?: (selectedClasses: FilterOption[]) => void;
	rankRange?: string;
	setRankRange?: (rankRange: string) => void;
	gameType?: string;
	setGameType?: (gameType: string) => void;
	region?: string;
	setRegion?: (region: string) => void;
}

interface State {
	inventory: InventoryGameType;
	expandWinrate: boolean;
	hasData: boolean;
	personalSortBy: string;
	personalSortDirection: SortDirection;
	showInfo: boolean;
	sortBy: string;
	sortDirection: SortDirection;
	showCollectionModal: boolean;
}

class DeckDetail extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			inventory: {},
			expandWinrate: false,
			hasData: undefined,
			personalSortBy: "card",
			personalSortDirection: "ascending",
			showInfo: false,
			sortBy: "card",
			sortDirection: "ascending",
			showCollectionModal: false,
		};
	}

	public componentDidMount(): void {
		if (this.props.rankRange === RankRange.TOP_1000_LEGEND) {
			this.props.setRankRange(RankRange.LEGEND_ONLY);
		}
		this.fetchInventory();
	}

	fetchInventory() {
		DataManager.get("single_deck_filter_inventory", {
			deck_id: this.props.deckId,
		})
			.then(data => {
				if (!data) {
					return Promise.reject("No data");
				}
				const inventory = data.series;
				const gameTypes = Object.keys(inventory);
				if (
					gameTypes &&
					gameTypes.indexOf(this.props.gameType) === -1 &&
					!UserData.isPremium()
				) {
					const gameType =
						gameTypes.indexOf("RANKED_STANDARD") !== -1
							? "RANKED_STANDARD"
							: "RANKED_WILD";
					this.props.setGameType(gameType);
				}
				this.setState({ inventory, hasData: gameTypes.length > 0 });
			})
			.catch(reason => {
				this.setState({ hasData: false });
				if (reason === 202) {
					// retry after 30 seconds
					setTimeout(() => this.fetchInventory(), 30000);
				}
			});
	}

	public render(): React.ReactNode {
		const { t } = this.props;
		const deckParams = this.getParams();
		const globalParams = _.omit(deckParams, "deck_id");
		const personalParams = this.getPersonalParams();

		const dbfIds = this.props.deckCards.split(",").map(Number);
		const cards: CardObj[] = [];
		let dustCost = null;
		let deckCharts = null;
		if (this.props.cardData) {
			dbfIds.forEach(id => {
				const card = this.props.cardData.fromDbf(id);
				const cardObj =
					cards.find(obj => obj.card.id === card.id) ||
					cards[cards.push({ card, count: 0 }) - 1];
				cardObj.count++;
			});
			dustCost = getDustCostForCollection(this.props.collection, cards);

			deckCharts = this.getChartData(cards).map(data => (
				<div className="chart-wrapper">
					<CardDetailPieChart
						data={data}
						customViewbox="0 30 400 310"
						removeEmpty
					/>
				</div>
			));
		}

		const isPremium = UserData.isPremium();
		const premiumTabIndex = isPremium ? 0 : -1;

		const infoBoxFilter = (
			filter: "rankRange" | "region",
			key: string,
			text: string,
		) => {
			let content: any = text;
			const hasFilter =
				filter === "rankRange"
					? this.hasRankRange(key)
					: this.hasRegion(key);
			if (this.state.hasData && !hasFilter) {
				content = (
					<Tooltip
						header={t("Not enough data")}
						content={t(
							"This deck does not have enough data at {text}.",
							{ text },
						)}
					>
						{text}
					</Tooltip>
				);
			}
			return (
				<InfoboxFilter value={key} disabled={!hasFilter}>
					{content}
				</InfoboxFilter>
			);
		};

		const overviewContent = [];

		const getDefaultDeckName = (playerClass: string) => {
			switch (playerClass) {
				case "DEATHKNIGHT":
					return t("Death Knight Deck");
				case "DRUID":
					return t("Druid Deck");
				case "HUNTER":
					return t("Hunter Deck");
				case "MAGE":
					return t("Mage Deck");
				case "PALADIN":
					return t("Paladin Deck");
				case "PRIEST":
					return t("Priest Deck");
				case "ROGUE":
					return t("Rogue Deck");
				case "SHAMAN":
					return t("Shaman Deck");
				case "WARLOCK":
					return t("Warlock Deck");
				case "WARRIOR":
					return t("Warrior Deck");
				default:
					return t("Neutral Deck");
			}
		};

		const cardList = (
			<div className="card-list-wrapper">
				<CardList
					cardData={this.props.cardData}
					cardList={dbfIds}
					name={
						this.props.deckName ||
						getDefaultDeckName(this.props.deckClass)
					}
					heroes={[this.props.heroDbfId]}
					collection={this.props.collection}
				/>
			</div>
		);

		const filters = [
			<PremiumWrapper
				analyticsLabel="Single Deck Opponent Selection"
				modalStyle="DeckMulligan"
			>
				<h2>
					{t("Select your opponent")}
					<InfoIcon
						className="pull-right"
						header={t("Opponent mulligan guide")}
						content={t(
							"Show Mulligan Guide data specific to your chosen opponent!",
						)}
					/>
				</h2>
				<ClassFilter
					filters="All"
					hideAll
					minimal
					tabIndex={premiumTabIndex}
					selectedClasses={this.props.selectedClasses}
					selectionChanged={selectedClasses =>
						this.props.setSelectedClasses(selectedClasses)
					}
					disabled={
						this.props.tab !== "mulligan-guide" &&
						this.props.tab !== "my-statistics"
					}
				/>
			</PremiumWrapper>,
		];
		let header = null;
		if (this.state.hasData === false) {
			header = (
				<h4 className="message-wrapper" id="message-no-data">
					{t(
						"This deck does not have enough data for global statistics.",
					)}
				</h4>
			);

			overviewContent.push(
				<div className="col-lg-6 col-md-6 col-sm-12 col-xs-12">
					{cardList}
					<ManaCurve cards={cards} />
				</div>,
				<div className="col-lg-6 col-md-6 col-sm-12 col-xs-12">
					{deckCharts && deckCharts[0]}
					{deckCharts && deckCharts[1]}
				</div>,
			);
		} else {
			filters.push(
				<div>
					<InfoboxFilterGroup
						header={t("Rank range")}
						infoHeader={t("Rank range")}
						infoContent={
							<>
								<p>
									{t(
										"Check out how this deck performs at higher ranks!",
									)}
								</p>
								<p>
									{t(
										"Greyed out filters indicate an insufficient amount of data for that rank range.",
									)}
								</p>
							</>
						}
						selectedValue={this.getRankRange()}
						onClick={rankRange =>
							this.props.setRankRange(rankRange)
						}
					>
						<PremiumWrapper
							analyticsLabel="Single Deck Rank Range"
							iconStyle={{ display: "none" }}
							modalStyle="TimeRankRegion"
						>
							{infoBoxFilter(
								"rankRange",
								RankRange.LEGEND_ONLY,
								t("Legend only"),
							)}
							{infoBoxFilter(
								"rankRange",
								RankRange.LEGEND_THROUGH_FIVE,
								t("{rankMin}–{rankMax}", {
									rankMin: t("Legend"),
									rankMax: 5,
								}),
							)}
							{infoBoxFilter(
								"rankRange",
								RankRange.LEGEND_THROUGH_TEN,
								t("{rankMin}–{rankMax}", {
									rankMin: t("Legend"),
									rankMax: 10,
								}),
							)}
						</PremiumWrapper>
						{infoBoxFilter(
							"rankRange",
							"ALL",
							t("{rankMin}–{rankMax}", {
								rankMin: t("Legend"),
								rankMax: 25,
							}),
						)}
					</InfoboxFilterGroup>
				</div>,
				<Feature feature="deck-detail-region-filter">
					<InfoboxFilterGroup
						header={t("Region")}
						selectedValue={this.getRegion()}
						onClick={region => this.props.setRegion(region)}
						infoHeader={t("Deck breakdown region")}
						infoContent={
							<>
								<p>
									{t(
										"Take a look at how this deck performs in your region!",
									)}
								</p>
								<br />
								<p>
									{t(
										"Greyed out filters indicate an insufficient amount of data for that region.",
									)}
								</p>
							</>
						}
					>
						<PremiumWrapper
							analyticsLabel="Single Deck Region"
							iconStyle={{ display: "none" }}
							modalStyle="TimeRankRegion"
						>
							{infoBoxFilter("region", "REGION_US", "Americas")}
							{infoBoxFilter("region", "REGION_EU", "Europe")}
							{infoBoxFilter("region", "REGION_KR", "Asia")}
							<Feature feature="region-filter-china">
								<InfoboxFilter value="REGION_CN">
									{infoBoxFilter(
										"region",
										"REGION_CN",
										"China",
									)}
								</InfoboxFilter>
							</Feature>
						</PremiumWrapper>
						{infoBoxFilter("region", "ALL", t("All regions"))}
					</InfoboxFilterGroup>
				</Feature>,
			);

			header = [
				<div className="col-lg-6 col-md-6">
					<div className="chart-wrapper wide">
						<DataInjector
							fetchCondition={
								!!this.state.hasData &&
								this.isWildDeck() !== undefined
							}
							query={{
								url: "single_deck_stats_over_time",
								params: deckParams,
							}}
						>
							<ChartLoading>
								<PopularityLineChart
									widthRatio={2}
									maxYDomain={10}
								/>
							</ChartLoading>
						</DataInjector>
						<InfoIcon
							header={t("Popularity over time")}
							content={t(
								"Percentage of games played with this deck.",
							)}
						/>
					</div>
				</div>,
				<div className="col-lg-6 col-md-6">
					<div className="chart-wrapper wide">
						<DataInjector
							fetchCondition={
								!!this.state.hasData &&
								this.isWildDeck() !== undefined
							}
							query={{
								url: "single_deck_stats_over_time",
								params: deckParams,
							}}
						>
							<ChartLoading>
								<WinrateLineChart widthRatio={2} />
							</ChartLoading>
						</DataInjector>
						<InfoIcon
							header={t("Winrate over time")}
							content={t(
								"Percentage of games won with this deck.",
							)}
						/>
					</div>
				</div>,
			];

			overviewContent.push(
				<div className="col-lg-3 col-md-6 col-sm-12 col-xs-12">
					{cardList}
				</div>,
				<div className="col-lg-5 col-md-6 col-sm-12 col-xs-12">
					<ManaCurve cards={cards} />
					<DataInjector
						fetchCondition={
							!!this.state.hasData &&
							this.isWildDeck !== undefined
						}
						query={[
							{
								key: "opponentWinrateData",
								params: deckParams,
								url:
									"single_deck_base_winrate_by_opponent_class",
							},
							{
								key: "deckListData",
								params: globalParams,
								url: "list_decks_by_win_rate",
							},
						]}
					>
						<TableLoading
							dataKeys={["opponentWinrateData", "deckListData"]}
						>
							<DeckOverviewTable
								deckId={this.props.deckId}
								playerClass={this.props.deckClass}
							/>
						</TableLoading>
					</DataInjector>
				</div>,
				<div className="col-lg-4 col-md-12 col-sm-12 col-xs-12">
					{deckCharts && deckCharts[0]}
					{deckCharts && deckCharts[1]}
				</div>,
			);
		}

		const { deckName, deckClass } = this.props;

		const copyDeckName = deckName
			? deckName.replace(/ Deck$/, "")
			: getHeroClassName(this.props.deckClass, t);

		return (
			<div className="deck-detail-container">
				<aside className="infobox">
					{this.props.archetypeId ? (
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
								archetypeId={+this.props.archetypeId}
								cardData={this.props.cardData}
							/>
						</DataInjector>
					) : (
						<img
							className="hero-image"
							src={getHeroSkinCardUrl(this.props.deckClass)}
						/>
					)}
					<div className="text-center copy-deck-wrapper">
						<CopyDeckButton
							cardData={this.props.cardData}
							cards={dbfIds}
							heroes={[this.props.heroDbfId]}
							format={
								this.getGameType() === "RANKED_STANDARD" ? 2 : 1
							}
							deckClass={this.props.deckClass}
							name={copyDeckName}
							sourceUrl={
								window && window.location
									? window.location.toString().split("#")[0]
									: undefined
							}
							onCopy={() =>
								DeckEvents.onCopyDeck(
									this.props.deckName,
									dustCost,
									!!this.props.collection,
								)
							}
						/>
					</div>
					{!this.props.collection ? (
						<CollectionBanner
							hasCollection={!!this.props.collection}
							wrapper={body => (
								<div
									className="infobox-banner"
									style={{
										backgroundImage: `url("${image(
											"feature-promotional/collection-syncing-sidebar.png",
										)}")`,
									}}
								>
									{body}
								</div>
							)}
						>
							{authenticated =>
								authenticated ? (
									<>
										{t(
											"Upload your collection to see which cards you're missing!",
										)}
									</>
								) : (
									<>
										{t(
											"Sign in to see whether you can build this deck!",
										)}
									</>
								)
							}
						</CollectionBanner>
					) : null}
					<h2>{t("Deck")}</h2>
					<ul>
						<li>
							{t("Class")}
							<a
								className="infobox-value"
								href={
									"/decks/#playerClasses=" +
									this.props.deckClass
								}
							>
								<PrettyCardClass
									cardClass={this.props.deckClass}
								/>
							</a>
						</li>
						{this.props.archetypeId ? (
							<DataInjector
								query={[
									{
										key: "archetypeData",
										params: {},
										url: "/api/v1/archetypes/",
									},
								]}
							>
								{({
									archetypeData,
								}: {
									archetypeData: Archetype[];
								}) => {
									const archetype =
										archetypeData &&
										archetypeData.find(
											a =>
												a.id === this.props.archetypeId,
										);
									if (
										!archetype ||
										!archetype.standard_ccp_signature_core
									) {
										return null;
									}
									return (
										<li>
											{t("Archetype")}
											<span className="infobox-value">
												<a
													href={getArchetypeUrl(
														this.props.archetypeId,
														archetype.name,
													)}
												>
													{archetype.name}
												</a>
												<Feature feature="archetype-naming">
													{" "}
													<a
														href={`/api/v1/decks/${
															this.props.deckId
														}/feedback/`}
														title={t("Feedback")}
													>
														<span className="glyphicon glyphicon-pencil" />
													</a>
												</Feature>
											</span>
										</li>
									);
								}}
							</DataInjector>
						) : null}
						<li>
							{t("GLOBAL_COST")}
							<span className="infobox-value">
								{dustCost !== null
									? t("{dustCost} Dust", { dustCost })
									: t("Counting…")}
							</span>
						</li>
					</ul>
					<AdUnit id="dd-m-1" size="320x50" mobile />
					{filters}
					<DataInjector
						fetchCondition={
							!!this.state.hasData &&
							this.isWildDeck() !== undefined
						}
						query={{
							url: "list_decks_by_win_rate",
							params: globalParams,
						}}
					>
						<HideLoading>
							<DeckStats
								playerClass={this.props.deckClass}
								deckId={this.props.deckId}
								lastUpdatedUrl="single_deck_stats_over_time"
								lastUpdatedParams={deckParams}
							/>
						</HideLoading>
					</DataInjector>
					{this.renderAdminSettings()}
					<AdUnit id="dd-d-9" size="300x250" />
					<AdUnit id="dd-d-10" size="300x250" />
				</aside>
				<main>
					<section id="content-header">
						<AdContainer>
							<AdUnit id="dd-d-1" size="728x90" />
							<AdUnit id="dd-d-2" size="728x90" />
						</AdContainer>
						{header}
						<AdUnit id="dd-m-2" size="300x250" mobile />
					</section>
					<section id="page-content">
						<TabList
							tab={this.props.tab}
							setTab={this.props.setTab}
						>
							<Tab label={t("Overview")} id="overview">
								<AdContainer>
									<AdUnit id="dd-d-3" size="728x90" />
									<AdUnit id="dd-d-4" size="728x90" />
								</AdContainer>
								{overviewContent}
							</Tab>
							<Tab
								label={t("Mulligan Guide")}
								id="mulligan-guide"
								hidden={this.state.hasData === false}
							>
								{this.renderMulliganGuideTable(
									deckParams,
									globalParams,
								)}
							</Tab>
							<Tab
								label={
									<span className="text-premium">
										{t("My Statistics")}
										<InfoIcon
											header={t("Personal statistics")}
											content={t(
												"See detailed statistics about your own performance of each card in this deck.",
											)}
										/>
									</span>
								}
								id="my-statistics"
								premiumModalOnClick="MyDeckMulligan"
							>
								{this.getMyStats()}
							</Tab>
							<Tab
								label={
									<span className="text-premium">
										{t("Matchups")}
										<InfoIcon
											header={t("Archetype matchups")}
											content={t(
												"See how this deck performs against specific archetypes.",
											)}
										/>
									</span>
								}
								id="matchups"
								hidden={
									this.state.hasData === false ||
									this.isWildDeck()
								}
								premiumModalOnClick="DeckMatchups"
							>
								{this.renderMatchups(deckParams)}
							</Tab>
							<Tab label={t("Similar Decks")} id="similar">
								<DataInjector
									fetchCondition={
										this.isWildDeck() !== undefined
									}
									query={{
										url: "list_decks_by_win_rate",
										params: globalParams,
									}}
								>
									<TableLoading
										cardData={this.props.cardData}
									>
										<SimilarDecksList
											playerClass={this.props.deckClass}
											rawCardList={this.props.deckCards}
											wildDeck={this.isWildDeck()}
											collection={this.props.collection}
										/>
									</TableLoading>
								</DataInjector>
							</Tab>
							<Tab
								label={
									<span className="text-premium">
										{t("Deck Counters")}
										<InfoIcon
											header={t("Deck Counters")}
											content={t(
												"A list of archetypes and decks that this deck has trouble against.",
											)}
										/>
									</span>
								}
								id="deck-counters"
								hidden={!UserData.hasFeature("deck-counters")}
							>
								<DataInjector
									fetchCondition={
										this.isWildDeck() !== undefined
									}
									query={[
										{
											key: "deckData",
											params: globalParams,
											url: "list_decks_by_win_rate",
										},
										{
											key: "countersData",
											params: deckParams,
											url:
												"single_deck_recommended_counters",
										},
									]}
								>
									<TableLoading
										cardData={this.props.cardData}
										dataKeys={["deckData", "countersData"]}
									>
										<DeckCountersList />
									</TableLoading>
								</DataInjector>
							</Tab>
							<Tab label={t("Streams")} id="streams">
								<h3 className="text-center">
									{t("Live on Twitch")}
								</h3>
								{this.renderStreams()}
							</Tab>
							<Tab
								label={t("VODs")}
								id="vods"
								hidden={!UserData.hasFeature("twitch-vods")}
							>
								{this.renderTwitchVods()}
							</Tab>
						</TabList>
						<AdUnit id="dd-m-3" size="320x50" mobile />
					</section>
				</main>
			</div>
		);
	}

	renderMulliganGuideTable(
		deckParams: any,
		globalParams: any,
	): React.ReactNode {
		const premiumMulligan =
			UserData.isPremium() &&
			this.props.selectedClasses.length &&
			this.props.selectedClasses[0] !== "ALL";

		const dataKey = this.props.selectedClasses.length
			? this.props.selectedClasses[0]
			: "ALL";

		const cards = this.getCards();

		return (
			<DataInjector
				fetchCondition={
					!!this.state.hasData && this.isWildDeck() !== undefined
				}
				query={[
					{
						key: "mulliganData",
						params: deckParams,
						url: premiumMulligan
							? "single_deck_mulligan_guide_by_class"
							: "single_deck_mulligan_guide",
					},
					{
						key: "winrateData",
						params: deckParams,
						url: "single_deck_base_winrate_by_opponent_class",
					},
				]}
				extract={{
					mulliganData: data => ({ data: data.series.data[dataKey] }),
					winrateData: data => {
						let baseWinrate = 50;
						if (premiumMulligan) {
							baseWinrate = +data.series.data[dataKey][0].winrate;
						} else {
							baseWinrate = +data.series.metadata.total_winrate;
						}
						return { baseWinrate };
					},
				}}
			>
				<CardTable
					cards={cards}
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
						this.setState({ sortBy, sortDirection });
					}}
					sortBy={this.state.sortBy}
					sortDirection={this.state.sortDirection as SortDirection}
					collection={this.props.collection}
					adInterval={Math.floor(cards.length / 2)}
					ads={
						["dd-d-5", "dd-d-6"].some(ad =>
							AdHelper.isAdEnabled(ad),
						)
							? [
									<AdContainer>
										<AdUnit id="dd-d-5" size="728x90" />
										<AdUnit id="dd-d-6" size="728x90" />
									</AdContainer>,
							  ]
							: null
					}
				/>
			</DataInjector>
		);
	}

	getMyStats(): React.ReactNode {
		const { t } = this.props;
		if (!UserData.isAuthenticated() || !UserData.isPremium()) {
			return (
				<PremiumPromo
					imageName="mystatistics_full.png"
					text={t(
						"You play this deck? View your personal Mulligan Guide and card statistics right here.",
					)}
				/>
			);
		}

		const params = {
			deck_id: this.props.deckId,
			...this.getPersonalParams(),
		};
		const selectedClass = this.props.selectedClasses.length
			? this.props.selectedClasses[0]
			: "ALL";
		const hasSelectedClass = selectedClass !== "ALL";
		return (
			<DataInjector
				fetchCondition={
					this.isWildDeck() !== undefined && UserData.isPremium()
				}
				query={{
					params,
					url: "single_account_lo_individual_card_stats_for_deck",
				}}
				extract={{
					data: data => ({ data: data.series.data[selectedClass] }),
				}}
			>
				<CardTable
					cards={this.getCards()}
					columns={[
						"mulliganWinrate",
						"keepPercent",
						"drawnWinrate",
						"playedWinrate",
						"turnsInHand",
						"turnPlayed",
						"timesPlayedPersonal",
						"damageDone",
						"healingDone",
						"heroesKilled",
						"minionsKilled",
					]}
					onSortChanged={(
						sortBy: string,
						sortDirection: SortDirection,
					) => {
						this.setState({
							personalSortBy: sortBy,
							personalSortDirection: sortDirection,
						});
					}}
					sortBy={this.state.personalSortBy}
					sortDirection={
						this.state.personalSortDirection as SortDirection
					}
					customNoDataMessage={
						hasSelectedClass
							? t(
									"You need to play at least twenty games against this class.",
							  )
							: t(
									"You need to play at least twenty games with this deck.",
							  )
					}
					collection={this.props.collection}
				/>
			</DataInjector>
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
							deck_id: this.props.deckId,
						},
						url: "/api/v1/vods/",
					},
				]}
			>
				<TwitchVods
					customNoDataMessage={t("No VODs available")}
					cardData={this.props.cardData}
					gameType={this.getGameType()}
					autoplay={this.props.tab === "vods"}
				/>
			</DataInjector>
		);
	}

	renderStreams(): React.ReactNode {
		const { t } = this.props;
		return (
			<DataInjector
				query={[
					{
						key: "streams",
						params: {},
						url: "/api/v1/live/streaming-now/",
					},
				]}
				extract={{
					streams: data => {
						const thisDeck = this.props.deckCards
							.split(",")
							.map(Number);
						return {
							streams: data.filter(stream =>
								compareDecks(stream.deck.map(Number), thisDeck),
							),
						};
					},
				}}
			>
				<StreamList customNoDataMessage={t("No streams available")} />
			</DataInjector>
		);
	}

	renderMatchups(deckParams: any): React.ReactNode {
		const { t } = this.props;
		if (!UserData.isAuthenticated() || !UserData.isPremium()) {
			return (
				<PremiumPromo
					imageName="deck_matchups_full.png"
					text={t(
						"View more details on how this decks performs against specific archetypes.",
					)}
				/>
			);
		}
		return (
			<DataInjector
				query={[
					{
						key: "archetypeMatchupData",
						params: deckParams,
						url: "single_deck_archetype_matchups",
					},
					{
						key: "archetypeData",
						params: {},
						url: "/api/v1/archetypes/",
					},
				]}
				extract={{
					archetypeMatchupData: data => ({
						archetypeMatchupData: data.series.data,
					}),
				}}
				fetchCondition={
					!!this.state.hasData && this.isWildDeck() !== undefined
				}
			>
				<ArchetypeMatchups
					archetypeId={+this.props.archetypeId}
					cardData={this.props.cardData}
					minGames={100}
				/>
			</DataInjector>
		);
	}

	getCards(): CardObj[] {
		const cards: CardObj[] = [];
		if (this.props.cardData) {
			const dbfIds = {};
			this.props.deckCards.split(",").map(id => {
				dbfIds[id] = (dbfIds[id] || 0) + 1;
			});
			Object.keys(dbfIds).forEach(dbfId => {
				cards.push({
					card: this.props.cardData.fromDbf(dbfId),
					count: dbfIds[dbfId],
				});
			});
		}
		return cards;
	}

	isWildDeck(): boolean {
		if (!this.props.deckCards || !this.props.cardData) {
			return undefined;
		}
		return this.props.deckCards
			.split(",")
			.map(dbfId => this.props.cardData.fromDbf(dbfId))
			.some(card => isWildSet(card.set));
	}

	hasGameType(gameType: string): boolean {
		if (!this.state.hasData) {
			// we always allow all game types if the deck is not eligible
			return true;
		}
		return Object.keys(this.state.inventory).indexOf(gameType) !== -1;
	}

	getGameType(forPersonal?: boolean): string {
		return forPersonal || this.hasGameType(this.props.gameType)
			? this.props.gameType
			: "RANKED_STANDARD";
	}

	hasRankRange(rankRange: string): boolean {
		if (!this.state.hasData) {
			return false;
		}
		const gameType = this.getGameType();
		const inventoryRegions = this.state.inventory[gameType];
		if (!inventoryRegions) {
			return false;
		}

		const rankRanges = inventoryRegions[this.props.region];
		if (!rankRanges || !Array.isArray(rankRanges)) {
			return false;
		}
		return rankRanges.indexOf(rankRange) !== -1;
	}

	getRegion() {
		return UserData.hasFeature("deck-region-filter") &&
			this.hasRegion(this.props.region)
			? this.props.region
			: "ALL";
	}

	hasRegion(region: string): boolean {
		if (!this.state.hasData) {
			return false;
		}
		const gameType = this.getGameType();
		const inventoryRegions = this.state.inventory[gameType];
		if (!inventoryRegions) {
			return false;
		}
		const rankRanges = inventoryRegions[region];
		if (!rankRanges || !Array.isArray(rankRanges)) {
			return false;
		}
		return rankRanges.indexOf(this.props.rankRange) !== -1;
	}

	getRankRange(): string {
		return this.hasRankRange(this.props.rankRange)
			? this.props.rankRange
			: "ALL";
	}

	getParams(): {
		GameType: string;
		RankRange: string;
		Region: string;
		deck_id: string;
	} {
		return {
			GameType: this.getGameType(),
			RankRange: this.getRankRange(),
			Region: this.getRegion(),
			deck_id: this.props.deckId,
		};
	}

	getPersonalParams(state?: State): any {
		state = state || this.state;
		return Object.assign(
			{},
			{
				GameType: this.getGameType(true),
			},
			this.props.account
				? {
						Region: this.props.account.region,
						account_lo: this.props.account.lo,
				  }
				: {},
		);
	}

	getChartData(cards: CardObj[]): RenderData[] {
		const dataSets = [{}, {}];

		cards.forEach(cardObj => {
			dataSets[0][cardObj.card.rarity] =
				(dataSets[0][cardObj.card.rarity] || 0) + cardObj.count;
			dataSets[1][cardObj.card.type] =
				(dataSets[1][cardObj.card.type] || 0) + cardObj.count;
		});

		const renderData = [
			{
				series: [
					{
						name: "rarity",
						data: [],
						metadata: { chart_scheme: "rarity" },
					},
				],
			},
			{
				series: [
					{
						name: "type",
						data: [],
						metadata: { chart_scheme: "cardtype" },
					},
				],
			},
		];

		dataSets.forEach((set, index) => {
			Object.keys(set).forEach(key => {
				renderData[index].series[0].data.push({ x: key, y: set[key] });
			});
		});

		return renderData;
	}

	renderAdminSettings(): React.ReactNode {
		if (!UserData.isStaff() || !this.props.adminUrl) {
			return;
		}

		return (
			<div>
				<h2>{this.props.t("Admin")}</h2>
				<ul>
					<li>
						<span>{this.props.t("View in Admin")}</span>
						<span className="infobox-value">
							<a href={this.props.adminUrl}>
								{this.props.t("Admin link")}
							</a>
						</span>
					</li>
				</ul>
			</div>
		);
	}
}

export default translate()(DeckDetail);
