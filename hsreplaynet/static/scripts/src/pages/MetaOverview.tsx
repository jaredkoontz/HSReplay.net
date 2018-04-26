import React from "react";
import CardData from "../CardData";
import UserData from "../UserData";
import DataInjector from "../components/DataInjector";
import Feature from "../components/Feature";
import InfoIcon from "../components/InfoIcon";
import InfoboxFilter from "../components/InfoboxFilter";
import InfoboxFilterGroup from "../components/InfoboxFilterGroup";
import InfoboxItem from "../components/InfoboxItem";
import InfoboxLastUpdated from "../components/InfoboxLastUpdated";
import Tab from "../components/layout/Tab";
import TabList from "../components/layout/TabList";
import ArchetypeList from "../components/metaoverview/ArchetypeList";
import ArchetypeMatchups from "../components/metaoverview/ArchetypeMatchups";
import ArchetypePopularity from "../components/metaoverview/ArchetypePopularity";
import ArchetypeTierList from "../components/metaoverview/ArchetypeTierList";
import PremiumPromo from "../components/premium/PremiumPromo";
import PremiumWrapper from "../components/premium/PremiumWrapper";
import RankPicker from "../components/rankpicker/RankPicker";
import { commaSeparate } from "../helpers";
import { SortDirection } from "../interfaces";

interface Props {
	cardData: CardData;
	popularitySortBy?: string;
	setPopularitySortBy?: (popularitySortBy: string) => void;
	popularitySortDirection?: SortDirection;
	setPopularitySortDirection?: (ascending: SortDirection) => void;
	sortDirection?: SortDirection;
	setSortDirection?: (ascending: SortDirection) => void;
	sortBy?: string;
	setSortBy?: (sortBy: string) => void;
	gameType?: string;
	setGameType?: (gameType: string) => void;
	timeFrame?: string;
	setTimeFrame?: (timeFrame: string) => void;
	tab?: string;
	setTab?: (tab: string) => void;
	rankRange?: string;
	setRankRange?: (rankRange: string) => void;
	region?: string;
	setRegion?: (region: string) => void;
}

interface State {
	archetypeListSortBy: string;
	archetypeListSortDirection: SortDirection;
	mobileView: boolean;
	showFilters: boolean;
}

const MOBILE_WIDTH = 530;

export default class MetaOverview extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			archetypeListSortBy: "archetype",
			archetypeListSortDirection: "ascending",
			mobileView: window.innerWidth <= MOBILE_WIDTH,
			showFilters: false,
		};
	}

	getGameType(): string {
		if (UserData.hasFeature("archetypes-gamemode-filter")) {
			return this.props.gameType;
		}
		return "RANKED_STANDARD";
	}

	getParams(): any {
		return {
			GameType: this.getGameType(),
			RankRange: this.props.rankRange,
			Region: this.props.region,
			TimeRange: this.props.timeFrame,
		};
	}

	getPopularityParams(): any {
		return {
			GameType: this.getGameType(),
			Region: this.props.region,
			TimeRange: this.props.timeFrame,
		};
	}

	public render(): React.ReactNode {
		const params = this.getParams();
		const popularityParams = this.getPopularityParams();

		let rankRangeFilter = null;
		if (
			["tierlist", "archetypes", "matchups"].indexOf(this.props.tab) !==
			-1
		) {
			rankRangeFilter = (
				<section id="rank-range-filter">
					<PremiumWrapper analyticsLabel="Meta Overview Rank Range">
						<h2>Rank Range</h2>
						<RankPicker
							selected={this.props.rankRange}
							onSelectionChanged={rankRange =>
								this.props.setRankRange(rankRange)
							}
						/>
					</PremiumWrapper>
				</section>
			);
		}

		const infoboxClassNames = ["infobox full-sm"];
		const contentClassNames = [];
		if (!this.state.showFilters) {
			infoboxClassNames.push("hidden-xs hidden-sm");
		} else {
			contentClassNames.push("hidden-xs hidden-sm");
		}

		const backButton = (
			<button
				className="btn btn-primary btn-full visible-sm visible-xs"
				type="button"
				onClick={() => this.setState({ showFilters: false })}
			>
				Back
			</button>
		);

		return (
			<div className="meta-overview-container">
				<aside className={infoboxClassNames.join(" ")}>
					{backButton}
					<h1>Meta Overview</h1>
					<section id="time-frame-filter">
						<InfoboxFilterGroup
							header="Time Frame"
							selectedValue={this.props.timeFrame}
							onClick={value => this.props.setTimeFrame(value)}
						>
							<PremiumWrapper
								analyticsLabel="Meta Overview Time Frame"
								iconStyle={{ display: "none" }}
							>
								<InfoboxFilter value="LAST_1_DAY">
									Last 1 day
								</InfoboxFilter>
								<InfoboxFilter value="LAST_3_DAYS">
									Last 3 days
								</InfoboxFilter>
							</PremiumWrapper>
							<InfoboxFilter value="LAST_7_DAYS">
								Last 7 days
							</InfoboxFilter>
							<Feature feature="current-expansion-filter">
								<InfoboxFilter value="CURRENT_EXPANSION">
									The Witchwood
									<span className="infobox-value">New!</span>
								</InfoboxFilter>
							</Feature>
						</InfoboxFilterGroup>
					</section>
					{rankRangeFilter}
					<Feature feature="archetypes-gamemode-filter">
						<section id="gamemode-filter">
							<InfoboxFilterGroup
								header="Game Mode"
								selectedValue={this.props.gameType}
								onClick={gameType =>
									this.props.setGameType(gameType)
								}
							>
								<InfoboxFilter value="RANKED_STANDARD">
									Ranked Standard
								</InfoboxFilter>
								<InfoboxFilter value="RANKED_WILD">
									Ranked Wild
								</InfoboxFilter>
							</InfoboxFilterGroup>
						</section>
					</Feature>
					<Feature feature="meta-region-filter">
						<section id="region-filter">
							<h2>Region</h2>
							<InfoIcon
								className="pull-right"
								header="Region Filter"
								content="Replay volume from the Chinese region is too low for reliable statistics."
							/>
							<InfoboxFilterGroup
								selectedValue={this.props.region}
								onClick={region => this.props.setRegion(region)}
							>
								<PremiumWrapper
									analyticsLabel="Meta Overview Region"
									iconStyle={{ display: "none" }}
								>
									<InfoboxFilter value="REGION_US">
										America
									</InfoboxFilter>
									<InfoboxFilter value="REGION_EU">
										Europe
									</InfoboxFilter>
									<InfoboxFilter value="REGION_KR">
										Asia
									</InfoboxFilter>
									<Feature feature="region-filter-china">
										<InfoboxFilter value="REGION_CN">
											China
										</InfoboxFilter>
									</Feature>
								</PremiumWrapper>
								<InfoboxFilter value="ALL">
									All Regions
								</InfoboxFilter>
							</InfoboxFilterGroup>
						</section>
					</Feature>
					<section id="info">
						<h2>Data</h2>
						<ul>
							<li>
								Game Mode
								<span className="infobox-value">
									Ranked Standard
								</span>
							</li>
							<InfoboxLastUpdated {...this.getLastUpdated()} />
							<DataInjector
								query={{
									params,
									url: "head_to_head_archetype_matchups",
								}}
								extract={{
									data: data => ({
										value: commaSeparate(
											data.series.metadata.totals
												.contributors,
										),
									}),
								}}
							>
								<InfoboxItem header="Contributors" />
							</DataInjector>
							<DataInjector
								query={{
									params,
									url: "head_to_head_archetype_matchups",
								}}
								extract={{
									data: data => ({
										value: commaSeparate(
											data.series.metadata.totals
												.total_games,
										),
									}),
								}}
							>
								<InfoboxItem header="Games" />
							</DataInjector>
						</ul>
					</section>
					{backButton}
				</aside>
				<main className={contentClassNames.join(" ")}>
					<button
						className="btn btn-default btn-filters visible-xs visible-sm"
						type="button"
						onClick={() => this.setState({ showFilters: true })}
					>
						<span className="glyphicon glyphicon-filter" />
						Filters
					</button>
					<TabList
						tab={this.props.tab}
						setTab={tab => this.props.setTab(tab)}
					>
						<Tab id="tierlist" label="Tier List">
							<DataInjector
								query={[
									{
										key: "archetypeData",
										params: {},
										url: "/api/v1/archetypes/",
									},
									{
										key: "deckData",
										params: {
											GameType: this.getGameType(),
											TimeRange:
												this.props.timeFrame ===
												"CURRENT_EXPANSION"
													? "CURRENT_EXPANSION"
													: "LAST_30_DAYS",
											Region: this.props.region,
										},
										url: "list_decks_by_win_rate",
									},
									{
										params,
										url:
											"archetype_popularity_distribution_stats",
									},
								]}
								extract={{
									data: data => ({
										data: data.series.data,
										timestamp: data.as_of,
									}),
								}}
							>
								<ArchetypeTierList
									gameType={this.getGameType()}
									cardData={this.props.cardData}
								/>
							</DataInjector>
						</Tab>
						<Tab id="archetypes" label="By Class">
							<DataInjector
								query={[
									{
										key: "archetypeData",
										params: {},
										url: "/api/v1/archetypes/",
									},
									{
										params,
										url:
											"archetype_popularity_distribution_stats",
									},
								]}
								extract={{
									data: data => ({
										data: data.series.data,
										timestamp: data.as_of,
									}),
								}}
							>
								<ArchetypeList
									sortBy={this.state.archetypeListSortBy}
									sortDirection={
										this.state.archetypeListSortDirection
									}
									onSortChanged={(
										archetypeListSortBy,
										archetypeListSortDirection,
									) => {
										this.setState({
											archetypeListSortBy,
											archetypeListSortDirection,
										});
									}}
									gameType={this.getGameType()}
									cardData={this.props.cardData}
								/>
							</DataInjector>
						</Tab>
						<Tab
							id="matchups"
							label="Matchups"
							hidden={this.state.mobileView}
						>
							<DataInjector
								query={[
									{
										key: "archetypeData",
										params: {},
										url: "/api/v1/archetypes/",
									},
									{
										key: "matchupData",
										params,
										url: "head_to_head_archetype_matchups",
									},
									{
										key: "popularityData",
										params,
										url:
											"archetype_popularity_distribution_stats",
									},
								]}
							>
								<ArchetypeMatchups
									cardData={this.props.cardData}
									gameType={this.getGameType()}
									mobileView={this.state.mobileView}
									setSortBy={this.props.setSortBy}
									setSortDirection={
										this.props.setSortDirection
									}
									sortBy={this.props.sortBy}
									sortDirection={this.props.sortDirection}
								/>
							</DataInjector>
						</Tab>
						<Tab
							label={
								<span className="text-premium">
									Popularity&nbsp;
									<InfoIcon
										header="Popularity"
										content="Archetype popularity broken down by rank."
									/>
								</span>
							}
							id="popularity"
							hidden={this.state.mobileView}
						>
							{this.renderPopularity(popularityParams)}
						</Tab>
					</TabList>
				</main>
			</div>
		);
	}

	renderPopularity(popularityParams: any): JSX.Element {
		if (!UserData.isAuthenticated() || !UserData.isPremium()) {
			return (
				<PremiumPromo
					imageName="metaoverview_popularity_full.png"
					text="Want a deeper insight into the meta? Find archetype popularities broken down by rank here."
				/>
			);
		}
		return (
			<DataInjector
				query={[
					{
						key: "archetypeData",
						params: {},
						url: "/api/v1/archetypes/",
					},
					{
						key: "popularityData",
						params: popularityParams,
						url: "archetype_popularity_by_rank",
					},
				]}
			>
				<ArchetypePopularity
					cardData={this.props.cardData}
					gameType={this.getGameType()}
					sortDirection={this.props.sortDirection}
					setSortDirection={this.props.setSortDirection}
					sortBy={this.props.popularitySortBy}
					setSortBy={this.props.setPopularitySortBy}
				/>
			</DataInjector>
		);
	}

	getLastUpdated(): any {
		const obj = { params: null, url: null };
		switch (this.props.tab) {
			case "popularity":
				obj.url = "archetype_popularity_by_rank";
				obj.params = this.getPopularityParams();
				break;
			case "archetypes":
			case "matchups":
			case "tierlist":
			default:
				obj.url = "archetype_popularity_distribution_stats";
				obj.params = this.getParams();
				break;
		}
		return obj;
	}

	public componentDidMount(): void {
		window.addEventListener("resize", this.onResize);
	}

	public componentWillUnmount(): void {
		window.removeEventListener("resize", this.onResize);
	}

	onResize = () => {
		const width = window.innerWidth;
		if (this.state.mobileView && width > MOBILE_WIDTH) {
			this.setState({ mobileView: false });
		} else if (!this.state.mobileView && width <= MOBILE_WIDTH) {
			this.setState({ mobileView: true });
		}
	};
}
