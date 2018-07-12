import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import CardData from "../CardData";
import UserData from "../UserData";
import DataInjector from "../components/DataInjector";
import Modal from "../components/Modal";
import ModeSvg from "../components/ModeSvg";
import CollectionSetup from "../components/collection/CollectionSetup";
import ArchetypeHighlight from "../components/home/ArchetypeHighlight";
import ClassRanking from "../components/home/ClassRanking";
import FeaturePanel from "../components/home/FeaturePanel";
import LiveData from "../components/home/LiveData";
import ReplayFeed from "../components/home/ReplayFeed";
import TierListPreview from "../components/home/TierListPreview";
import ArchetypeMatchups from "../components/metaoverview/ArchetypeMatchups";
import PremiumModal from "../components/premium/PremiumModal";
import { BnetGameType } from "../hearthstone";
import { image } from "../helpers";
import MulliganGuidePreview from "../components/home/MulliganGuidePreview";
import Panel from "../components/Panel";
import { default as Twitch } from "../Twitch";
import TwitchStream from "../components/TwitchStream";
import { AutoSizer } from "react-virtualized";
import { TwitchStreamPromotionEvents } from "../metrics/GoogleAnalytics";
import HDTVideo from "../components/HDTVideo";

interface Props extends InjectedTranslateProps {
	cardData: CardData | null;
	promotedStreamer: string;
}

interface State {
	gameType: BnetGameType;
	fullReplaySpeed: boolean;
	showPremiumModal: boolean;
	showCollectionModal: boolean;
	promoStreamLive?: boolean;
}

class Home extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			gameType: BnetGameType.BGT_RANKED_STANDARD,
			fullReplaySpeed: false,
			showCollectionModal: false,
			showPremiumModal: false,
			promoStreamLive: false,
		};
	}

	componentDidMount() {
		this.verifyStreamIsLive();
	}

	verifyStreamIsLive(): void {
		const { promotedStreamer } = this.props;
		if (!promotedStreamer || !UserData.hasFeature("promo-stream")) {
			return;
		}
		Twitch.fetchStreamMetadata([promotedStreamer]).then((result): void => {
			if (Twitch.isLive(result[promotedStreamer])) {
				this.setState({ promoStreamLive: true });
				TwitchStreamPromotionEvents.onFrontpageStreamLoaded(
					promotedStreamer,
				);
			}
		});
	}

	renderPromoPanel(): React.ReactNode {
		if (this.state.promoStreamLive && UserData.hasFeature("promo-stream")) {
			return (
				<Panel className={"streamer-panel"}>
					<AutoSizer>
						{({ height, width }) => {
							return (
								<TwitchStream
									channel={this.props.promotedStreamer}
									width={width}
									height={height}
								/>
							);
						}}
					</AutoSizer>
					<h1 className="panel-header">Watch Live Now!</h1>
				</Panel>
			);
		}
		const { t } = this.props;
		return (
			<FeaturePanel
				title={t("Replays")}
				subtitle={t("Watch and share your games")}
				backgroundCardId="PART_002"
				href="/games/mine/"
			/>
		);
	}

	public render(): React.ReactNode {
		const { t } = this.props;
		const bannerStyle = {
			backgroundImage: `url("${image("banner.jpg")}")`,
		};
		const archetypeDataQuery = {
			url: "/api/v1/archetypes",
			key: "archetypeData",
		};
		const ranks = Array.from(Array(9).keys()).map(n => {
			const path =
				n === 0
					? image("banner-legend.png")
					: image(`ranked-medals/Medal_Ranked_${n}.png`);

			return <img key={n} src={path} />;
		});
		ranks.reverse();
		return (
			<div className="container-fluid">
				<div className="row" id="banner" style={bannerStyle}>
					<div id="banner-wrapper">
						<div id="banner-text">
							<h1>{t("Unleash your potential")}</h1>
							<h2 className="hidden-xs">
								{t(
									"Find the best deck for your rank and region",
								)}
							</h2>
						</div>
						<div id="banner-ranks">{ranks}</div>
					</div>
				</div>
				<div className="row content-row features">
					<div className="col-lg-4 col-md-6 col-sm-6 col-xs-12">
						<Panel
							header={
								<>
									<span>{t("Live Data")}</span>
									{this.renderLiveDataButton()}
								</>
							}
							theme="dark"
							accent="blue"
						>
							<DataInjector
								query={[
									archetypeDataQuery,
									{
										url: "/api/v1/live/games_count/weekly/",
										key: "gamesCountData",
									},
								]}
								extract={{
									gamesCountData: data => ({
										gamesCountData: data.data,
									}),
								}}
							>
								<ReplayFeed
									fullSpeed={this.state.fullReplaySpeed}
								/>
							</DataInjector>
						</Panel>
						{this.renderPromoPanel()}
					</div>
					<div className="col-lg-4 col-md-6 col-sm-6 col-xs-12">
						<Panel
							header={
								<>
									<span>{t("Premium Feature")}</span>
									{this.renderPremiumFeatureButton()}
								</>
							}
							accent="premium"
							theme="dark"
						>
							<DataInjector
								query={[
									archetypeDataQuery,
									{
										url: "/analytics/meta/preview/",
										key: "previewData",
									},
								]}
								extract={{
									previewData: data => ({
										data,
									}),
								}}
							>
								<ArchetypeHighlight
									cardData={this.props.cardData}
								/>
							</DataInjector>
						</Panel>
						{this.renderPremiumPanel()}
					</div>
					<div className="col-lg-4 col-xs-12">
						<Panel
							header={
								<>
									<span className="hidden-xs">
										{t("Class Winrates")}
									</span>
									<span className="visible-xs">
										{t("Winrates")}
									</span>
									{this.renderArchetypeHighlightButton()}
								</>
							}
							theme="dark"
							accent="blue"
						>
							<DataInjector
								query={{
									url: "player_class_performance_summary",
								}}
								extract={{
									data: data => ({
										classData: data.series.data,
									}),
								}}
							>
								<ClassRanking gameType={this.state.gameType} />
							</DataInjector>
						</Panel>
						<Modal
							visible={this.state.showCollectionModal}
							onClose={this.closeCollectionModal}
						>
							<CollectionSetup />
						</Modal>
						<FeaturePanel
							title={t("Collection Uploading")}
							subtitle={t(
								"Find the best decks for your collection",
							)}
							backgroundCardId="LOOTA_814"
							onClick={this.showCollectionModal}
						/>
					</div>
				</div>
				{this.renderBelowTheFold()}
			</div>
		);
	}

	private showCollectionModal = (
		event?: React.MouseEvent<HTMLElement>,
	): void => {
		if (event) {
			event.preventDefault();
		}
		this.setState({ showCollectionModal: true });
	};

	private closeCollectionModal = (): void =>
		this.setState({ showCollectionModal: false });

	private renderBelowTheFold(): React.ReactNode {
		const { t } = this.props;
		return (
			<>
				<div className="row content-row info-content" id="pilot">
					<Panel
						header={t("Be a Better Deck Pilot")}
						theme="light"
						accent="blue"
					>
						<div className="panel-description col-md-5 col-xs-12">
							<h1>{t("Hearthstone Deck Tracker")}</h1>
							<p>
								{t(
									"Play like a pro! Keep track of the cards you and your opponent play with an in-game overlay.",
								)}
							</p>
							<a
								className="btn promo-button transparent-style hidden-sm hidden-xs"
								href="https://hsdecktracker.net/download/"
							>
								{t("Download")}
							</a>
						</div>
						<div className="panel-feature col-md-7 col-xs-12">
							<HDTVideo autoplay autoplayDelay={5000} />
						</div>
						<div className="panel-button col-xs-12 visible-sm visible-xs">
							<a
								className="btn promo-button transparent-style"
								href="https://hsdecktracker.net/download/"
							>
								{t("Download")}
							</a>
						</div>
					</Panel>
					<Panel
						theme="light"
						accent="blue"
						className="reverse-panel"
					>
						<div className="panel-button col-xs-12 visible-sm visible-xs">
							<a
								className="btn promo-button transparent-style"
								href="/decks/"
							>
								{t("Find your deck")}
							</a>
						</div>
						<div className="panel-feature col-md-7 col-xs-12">
							<DataInjector
								query={[
									{
										key: "data",
										url: "/analytics/mulligan/preview/",
										params: {},
									},
									{
										key: "archetypeData",
										url: "/api/v1/archetypes/",
										params: {},
									},
								]}
							>
								<MulliganGuidePreview
									cardData={this.props.cardData}
								/>
							</DataInjector>
						</div>
						<div className="panel-description col-md-5 col-xs-12">
							<h1>{t("Mulligan Guide")}</h1>
							<p>
								{t(
									"Many games are decided based on your starting hand. Learn which cards to keep based on statistics from millions of games.",
								)}
							</p>
							<a
								className="btn promo-button transparent-style hidden-sm hidden-xs"
								href="/decks/"
							>
								{t("Find your deck")}
							</a>
						</div>
					</Panel>
					<Panel
						header={t("Master the Meta")}
						theme="light"
						accent="blue"
					>
						<div className="panel-description col-md-5 col-xs-12">
							<h1>{t("Meta Tier List")}</h1>
							<p>
								{t(
									"Climb the ladder faster by using the best deck for your rank and region.",
								)}
							</p>
							<a
								className="btn promo-button transparent-style hidden-sm hidden-xs"
								href="/meta/"
							>
								{t("View full tier list")}
							</a>
						</div>
						<div className="panel-feature col-md-7 col-xs-12">
							<DataInjector
								query={[
									{
										key: "archetypeData",
										params: {},
										url: "/api/v1/archetypes/",
									},
									{
										key: "deckData",
										params: {},
										url: "list_decks_by_win_rate",
									},
									{
										params: {},
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
								<TierListPreview
									cardData={this.props.cardData}
								/>
							</DataInjector>
						</div>
						<div className="panel-button col-xs-12 visible-sm visible-xs">
							<a
								className="btn promo-button transparent-style"
								href="/meta/"
							>
								{t("View full tier list")}
							</a>
						</div>
					</Panel>
					<Panel
						theme="light"
						accent="blue"
						className="reverse-panel"
					>
						<div className="panel-button col-xs-12 visible-sm visible-xs">
							<a
								className="btn promo-button transparent-style"
								href="/meta/#tab=matchups"
							>
								{t("View all matchups")}
							</a>
						</div>
						<div
							className="panel-feature col-md-7 col-xs-12"
							id="feature-meta"
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
										params: {},
										url: "head_to_head_archetype_matchups",
									},
									{
										key: "popularityData",
										params: {},
										url:
											"archetype_popularity_distribution_stats",
									},
								]}
							>
								<ArchetypeMatchups
									cardData={this.props.cardData}
									gameType="RANKED_STANDARD"
									mobileView={false}
									setSortBy={() => null}
									setSortDirection={() => null}
									sortBy="popularity"
									sortDirection="descending"
									simple
								/>
							</DataInjector>
						</div>
						<div className="panel-description col-md-5 col-xs-12">
							<h1>{t("Archetype Matchups")}</h1>
							<p>
								{t(
									"Find the counter! Discover the archetype that will beat your opponent.",
								)}
							</p>
							<a
								className="btn promo-button transparent-style hidden-sm hidden-xs"
								href="/meta/#tab=matchups"
							>
								{t("View all matchups")}
							</a>
						</div>
					</Panel>
					<Panel
						header={t("Live Data")}
						theme="light"
						accent="blue"
						id="live-data"
					>
						<LiveData
							cardData={this.props.cardData}
							numCards={12}
						/>
					</Panel>
				</div>
			</>
		);
	}

	private renderCollectionPanel(): React.ReactNode {
		return (
			<>
				<Modal
					visible={this.state.showCollectionModal}
					onClose={this.closeCollectionModal}
				>
					<CollectionSetup />
				</Modal>
				<FeaturePanel
					title="Collection Uploading"
					subtitle="Find the best decks for your collection"
					backgroundCardId="LOOTA_814"
					onClick={this.showCollectionModal}
				/>
			</>
		);
	}

	private showPremiumModal = (
		event?: React.MouseEvent<HTMLElement>,
	): void => {
		if (event) {
			event.preventDefault();
		}
		this.setState({ showPremiumModal: true });
	};

	private closePremiumModal = (): void =>
		this.setState({ showPremiumModal: false });

	private renderPremiumFeatureButton(): React.ReactNode {
		const { t } = this.props;
		if (UserData.isPremium()) {
			return null;
		}
		return (
			<a
				href="#"
				className="btn feature-btn"
				onClick={this.showPremiumModal}
			>
				<span className="hidden-xs">
					{t("Subscribe for full access")}
				</span>
				<span className="visible-xs">{t("Subscribe")}</span>
			</a>
		);
	}

	private renderLiveDataButton(): React.ReactNode {
		const { t } = this.props;
		return (
			<>
				<a
					href="#"
					className={
						"btn feature-btn" +
						(this.state.fullReplaySpeed ? " active" : "")
					}
					onClick={e => {
						e.preventDefault();
						this.setState({
							fullReplaySpeed: !this.state.fullReplaySpeed,
						});
					}}
				>
					<span>{t("Full speed")}</span>
				</a>
			</>
		);
	}

	private renderArchetypeHighlightButton(): React.ReactNode {
		const { t } = this.props;
		return (
			<>
				<a
					className={
						"btn feature-btn " +
						(this.state.gameType ===
						BnetGameType.BGT_RANKED_STANDARD
							? "active"
							: "")
					}
					onClick={e => {
						e.preventDefault();
						this.setState({
							gameType: BnetGameType.BGT_RANKED_STANDARD,
						});
					}}
				>
					<ModeSvg type="standard" />
					{t("Standard")}
				</a>
				<a
					className={
						"btn feature-btn " +
						(this.state.gameType === BnetGameType.BGT_RANKED_WILD
							? "active"
							: "")
					}
					onClick={e => {
						e.preventDefault();
						this.setState({
							gameType: BnetGameType.BGT_RANKED_WILD,
						});
					}}
				>
					<ModeSvg type="wild" />
					{t("Wild")}
				</a>
				<a
					className={
						"btn feature-btn " +
						(this.state.gameType === BnetGameType.BGT_ARENA
							? "active"
							: "")
					}
					onClick={e => {
						e.preventDefault();
						this.setState({
							gameType: BnetGameType.BGT_ARENA,
						});
					}}
				>
					<ModeSvg type="arena" />
					{t("Arena")}
				</a>
			</>
		);
	}

	private renderPremiumPanel(): React.ReactNode {
		const { t } = this.props;
		if (UserData.isPremium()) {
			return (
				<FeaturePanel
					title={t("My Decks")}
					subtitle={t("Check out statistics about your decks")}
					backgroundCardId="KARA_00_07"
					backgroundStyle={{
						backgroundPositionY: "30%",
					}}
					href="/decks/mine/"
				/>
			);
		}
		return (
			<>
				<Modal
					visible={this.state.showPremiumModal}
					onClose={this.closePremiumModal}
				>
					<PremiumModal modalStyle="TimeRankRegion" />
				</Modal>
				<div className="feature-panel">
					<div className="feature-content premium-feature">
						<div className="header-wrapper">
							<h1>{t("HSReplay.net Premium")}</h1>
						</div>
						<div className="premium-banner">
							<ul className="hidden-xs">
								<li>{t("Climb the ranked ladder")}</li>
								<li>{t("Analyze live statistics")}</li>
								<li>{t("Counter the meta")}</li>
							</ul>
							<div className="btn-wrapper">
								<a
									className="btn promo-button blue-style"
									href="/premium/"
								>
									{t("Learn more")}
								</a>
								<a
									className="btn promo-button"
									href="#"
									onClick={this.showPremiumModal}
								>
									{t("Subscribe")}
								</a>
							</div>
						</div>
					</div>
				</div>
			</>
		);
	}
}

export default translate()(Home);
