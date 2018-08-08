import React, { Fragment } from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import CardData from "../CardData";
import DataManager from "../DataManager";
import UserData, { Account } from "../UserData";
import ClassFilter, { FilterOption } from "../components/ClassFilter";
import DataInjector from "../components/DataInjector";
import Feature from "../components/Feature";
import InfoboxFilter from "../components/InfoboxFilter";
import InfoboxFilterGroup from "../components/InfoboxFilterGroup";
import InfoboxLastUpdated from "../components/InfoboxLastUpdated";
import ResetHeader from "../components/ResetHeader";
import CardTable from "../components/tables/CardTable";
import PrettyTimeRange from "../components/text/PrettyTimeRange";
import { TimeRange } from "../filters";
import { FragmentChildProps, SortDirection } from "../interfaces";
import AllSet from "../components/onboarding/AllSet";
import ConnectAccount from "../components/onboarding/ConnectAccount";
import AdContainer from "../components/ads/AdContainer";
import AdUnit from "../components/ads/AdUnit";
import LoadingSpinner from "../components/LoadingSpinner";
import CardFilterManager from "../components/cards/CardFilterManager";

interface Props extends FragmentChildProps, InjectedTranslateProps {
	cardData: CardData;
	account: Account | null;

	showSparse?: boolean;
	setShowSparse?: (showSparse: boolean) => void;
	format?: string;
	setFormat?: (format: string) => void;
	gameType?: string;
	setGameType?: (gameType: string) => void;
	playerClass?: string;
	setPlayerClass?: (playerClass: string) => void;
	rankRange?: string;
	setRankRange?: (rankRange: string) => void;
	timeRange?: string;
	setTimeRange?: (timeRange: string) => void;

	sortBy?: string;
	setSortBy?: (sortBy: string) => void;
	sortDirection?: SortDirection;
	setSortDirection?: (sortDirection: SortDirection) => void;
}

interface State {
	filteredCards: number[] | null;
	hasPersonalData: boolean;
	numCards: number;
	showFilters: boolean;
}

class Cards extends React.Component<Props, State> {
	showMoreButton: HTMLDivElement;

	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			filteredCards: null,
			hasPersonalData: false,
			numCards: 24,
			showFilters: false,
		};
	}

	onSearchScroll(): void {
		if (!this.showMoreButton) {
			return;
		}
		if (
			this.state.filteredCards !== null &&
			this.state.numCards >= this.state.filteredCards.length
		) {
			return;
		}
		const rect = this.showMoreButton.getBoundingClientRect();
		if (rect.top < window.innerHeight) {
			this.setState({ numCards: this.state.numCards + 12 });
		}
	}

	private scrollCb;

	public componentDidMount(): void {
		if (this.props.account) {
			DataManager.get(
				"single_account_lo_individual_card_stats",
				this.getPersonalParams(),
			).then(data =>
				this.setState({
					hasPersonalData: data && data.series.data.ALL.length > 0,
				}),
			);
		}

		this.scrollCb = () => this.onSearchScroll();
		document.addEventListener("scroll", this.scrollCb);
	}

	public componentWillUnmount(): void {
		document.removeEventListener("scroll", this.scrollCb);
	}

	public componentDidUpdate(
		prevProps: Readonly<Props>,
		prevState: Readonly<State>,
		prevContext: any,
	): void {
		if (UserData.hasFeature("current-arena-event-filter")) {
			if (
				prevProps.timeRange !== "ARENA_EVENT" &&
				this.props.timeRange === "ARENA_EVENT"
			) {
				this.props.setGameType("ARENA");
			}
			if (
				prevProps.gameType !== "ARENA" &&
				this.props.gameType === "ARENA"
			) {
				this.props.setTimeRange("ARENA_EVENT");
			}
			if (
				this.props.timeRange === "ARENA_EVENT" &&
				prevProps.gameType === "ARENA" &&
				this.props.gameType !== "ARENA"
			) {
				this.props.reset("timeRange");
			}
		}
	}

	public render(): React.ReactNode {
		const { t } = this.props;
		const content = [];

		let showMoreButton = null;

		if (
			this.state.filteredCards !== null &&
			this.state.filteredCards.length > this.state.numCards
		) {
			showMoreButton = (
				<div
					id="more-button-wrapper"
					ref={ref => (this.showMoreButton = ref)}
				>
					<button
						type="button"
						className="btn btn-default"
						onClick={() =>
							this.setState({
								numCards: this.state.numCards + 20,
							})
						}
					>
						Show more…
					</button>
				</div>
			);
		}

		if (!this.props.cardData || !this.state.filteredCards) {
			content.push(
				<div className="table-wrapper">
					<div className="message-wrapper">
						<LoadingSpinner active />
					</div>
				</div>,
			);
		} else if (this.props.account) {
			content.push(
				<div className="table-wrapper">
					<DataInjector
						query={{
							params: this.getPersonalParams(),
							url: "single_account_lo_individual_card_stats",
						}}
						extract={{
							data: data => ({ data: data.series.data.ALL }),
						}}
					>
						<CardTable
							cards={this.state.filteredCards.map(dbfId => ({
								card: this.props.cardData.fromDbf(dbfId),
								count: 1,
							}))}
							columns={[
								"totalGames",
								"winrate",
								"timesPlayedPersonal",
								"distinctDecks",
								"damageDone",
								"healingDone",
								"heroesKilled",
								"minionsKilled",
							]}
							sortBy={this.props.sortBy}
							sortDirection={this.props.sortDirection}
							onSortChanged={(a, b) => this.onSortChanged(a, b)}
							numCards={this.state.numCards}
							customNoDataMessage={
								<AllSet
									account={this.props.account}
									feature={t("personalized deck statistics")}
								>
									{t(
										"After you've played some games you'll find statistics for all the cards you play right here.",
									)}
								</AllSet>
							}
						/>
					</DataInjector>
				</div>,
			);
			if (showMoreButton && this.state.hasPersonalData) {
				content.push(showMoreButton);
			}
		} else {
			content.push(
				<div className="message-wrapper">
					<ConnectAccount
						feature={t("personalized card statistics")}
					/>
				</div>,
			);
		}

		const filterClassNames = ["infobox full-xs"];
		const contentClassNames = ["card-list-wrapper"];
		if (!this.state.showFilters) {
			filterClassNames.push("hidden-xs");
		} else {
			contentClassNames.push("hidden-xs");
		}

		const backButton = (
			<button
				className="btn btn-primary btn-full visible-xs"
				type="button"
				onClick={() => this.setState({ showFilters: false })}
			>
				{t("Back to card list")}
			</button>
		);

		return (
			<div className="cards">
				<CardFilterManager
					cardData={this.props.cardData}
					onFilter={filteredCards => this.setState({ filteredCards })}
				>
					<aside
						className={filterClassNames.join(" ")}
						id="cards-infobox"
					>
						{backButton}
						{this.buildFilters()}
						{backButton}
						<AdUnit id="cl-d-3" size="300x250" />
						<AdUnit id="cl-d-4" size="300x250" />
					</aside>
					<main className={contentClassNames.join(" ")}>
						<AdContainer>
							<AdUnit id="cl-d-1" size="728x90" />
							<AdUnit id="cl-d-2" size="728x90" />
						</AdContainer>
						<button
							className="btn btn-default visible-xs"
							id="filter-button"
							type="button"
							onClick={() =>
								this.setState({
									showFilters: !this.state.showFilters,
								})
							}
						>
							<span className="glyphicon glyphicon-filter" />
							{t("Filters")}
						</button>
						{/*{search}*/}
						{content}
					</main>
				</CardFilterManager>
			</div>
		);
	}

	buildFilters(): JSX.Element[] {
		const showReset = this.props.canBeReset;
		const { t } = this.props;

		const filters = [
			<ResetHeader
				key="reset"
				onReset={() => this.props.reset()}
				showReset={showReset}
			>
				{t("My Cards")}
			</ResetHeader>,
		];

		filters.push(
			<Fragment key="class">
				<h2>{t("Class")}</h2>
				<ClassFilter
					filters="AllNeutral"
					hideAll
					minimal
					selectedClasses={[this.props.playerClass as FilterOption]}
					selectionChanged={selected =>
						this.props.setPlayerClass(selected[0])
					}
				/>
			</Fragment>,
		);

		filters.push(
			<section id="mode-filter" key="mode-filter">
				<InfoboxFilterGroup
					header={t("Game Mode")}
					selectedValue={this.props.gameType}
					onClick={value => this.props.setGameType(value)}
				>
					<InfoboxFilter value="RANKED_STANDARD">
						{t("Ranked Standard")}
					</InfoboxFilter>
					<InfoboxFilter value="RANKED_WILD">
						{t("Ranked Wild")}
					</InfoboxFilter>
					<InfoboxFilter value="ARENA">{t("Arena")}</InfoboxFilter>
				</InfoboxFilterGroup>
			</section>,
		);
		filters.push(
			<InfoboxFilterGroup
				header={t("Time frame")}
				selectedValue={this.props.timeRange}
				onClick={value => this.props.setTimeRange(value)}
				key="timeframe"
			>
				<InfoboxFilter value={TimeRange.LAST_3_DAYS}>
					<PrettyTimeRange timeRange={TimeRange.LAST_3_DAYS} />
				</InfoboxFilter>
				<InfoboxFilter value={TimeRange.LAST_7_DAYS}>
					<PrettyTimeRange timeRange={TimeRange.LAST_7_DAYS} />
				</InfoboxFilter>
				<InfoboxFilter value={TimeRange.LAST_30_DAYS}>
					<PrettyTimeRange timeRange={TimeRange.LAST_30_DAYS} />
				</InfoboxFilter>
				<InfoboxFilter value={TimeRange.CURRENT_SEASON}>
					<PrettyTimeRange timeRange={TimeRange.CURRENT_SEASON} />
				</InfoboxFilter>
				<Feature feature={"current-expansion-filter"}>
					<InfoboxFilter value={TimeRange.CURRENT_EXPANSION}>
						<PrettyTimeRange
							timeRange={TimeRange.CURRENT_EXPANSION}
						/>
						<span className="infobox-value">New!</span>
					</InfoboxFilter>
				</Feature>
				<Feature feature={"current-patch-filter"}>
					<InfoboxFilter value={TimeRange.CURRENT_PATCH}>
						<PrettyTimeRange timeRange={TimeRange.CURRENT_PATCH} />
						<span className="infobox-value">{t("New!")}</span>
					</InfoboxFilter>
				</Feature>
			</InfoboxFilterGroup>,
		);

		if (this.props.account) {
			filters.push(
				<Fragment key="data">
					<h2>{t("Data")}</h2>
					<ul>
						<InfoboxLastUpdated
							url={"single_account_lo_individual_card_stats"}
							params={this.getPersonalParams()}
						/>
					</ul>
					<InfoboxFilterGroup
						deselectable
						selectedValue={this.props.showSparse ? "show" : null}
						onClick={value =>
							this.props.setShowSparse(
								value === "show" ? true : false,
							)
						}
					>
						<InfoboxFilter value="show">
							{t("Show sparse data")}
						</InfoboxFilter>
					</InfoboxFilterGroup>
				</Fragment>,
			);
		}

		return filters;
	}

	getPersonalParams(): any {
		if (!this.props.account) {
			return {};
		}
		return {
			GameType: this.props.gameType,
			Region: this.props.account.region,
			account_lo: this.props.account.lo,
			TimeRange: this.props.timeRange,
		};
	}

	onSortChanged(sortBy, sortDirection): void {
		this.props.setSortBy(sortBy);
		this.props.setSortDirection(sortDirection);
	}
}

export default translate()(Cards);
