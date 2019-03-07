import React from "react";
import {
	InjectedTranslateProps,
	translate,
	TranslationFunction,
} from "react-i18next";
import { AutoSizer } from "react-virtualized";
import CardData from "../CardData";
import AdContainer from "../components/ads/AdContainer";
import AdUnit from "../components/ads/AdUnit";
import GutterAdUnit from "../components/ads/GutterAdUnit";
import CollectionSetup from "../components/collection/CollectionSetup";
import DataInjector from "../components/DataInjector";
import HDTVideo from "../components/HDTVideo";
import ArchetypeHighlight from "../components/home/ArchetypeHighlight";
import ClassRanking from "../components/home/ClassRanking";
import FeaturePanel from "../components/home/FeaturePanel";
import LiveData from "../components/home/LiveData";
import MulliganGuidePreview from "../components/home/MulliganGuidePreview";
import ReplayFeed from "../components/home/ReplayFeed";
import TierListPreview from "../components/home/TierListPreview";
import ArchetypeMatchups from "../components/metaoverview/ArchetypeMatchups";
import Modal from "../components/Modal";
import ModeSvg from "../components/ModeSvg";
import Panel from "../components/Panel";
import PremiumModal from "../components/premium/PremiumModal";
import TwitchEmbed from "../components/TwitchEmbed";
import { BnetGameType } from "../hearthstone";
import { image } from "../helpers";
import { TwitchStreamPromotionEvents } from "../metrics/Events";
import { default as Twitch } from "../Twitch";
import UserData from "../UserData";
import memoize from "memoize-one";

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

const PromoBanner: React.SFC<{
	href: string;
	backgroundImage: string;
	title?: string;
	subtitle?: string;
	target?: string;
}> = props => (
	<a
		href={props.href}
		className="feature-promo"
		target={props.target || "_self"}
	>
		<img src={props.backgroundImage} />
		<div className="feature-promo-content">
			{props.title ? <h4>{props.title}</h4> : null}
			{props.subtitle ? <p>{props.subtitle}</p> : null}
		</div>
	</a>
);

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
			if (Twitch.isStreamingHearthstone(result[promotedStreamer])) {
				this.setState({ promoStreamLive: true });
				TwitchStreamPromotionEvents.onFrontpageStreamLoaded(
					promotedStreamer,
				);
			}
		});
	}

	renderPromoPanel(): React.ReactNode {
		const { t } = this.props;
		if (this.state.promoStreamLive && UserData.hasFeature("promo-stream")) {
			return (
				<Panel className={"streamer-panel"}>
					<AutoSizer>
						{({ height, width }) => {
							return (
								<TwitchEmbed
									channel={this.props.promotedStreamer}
									width={width}
									height={height}
									muted
									autoplay
								/>
							);
						}}
					</AutoSizer>
					<h1 className="panel-header">{t("Watch Live Now!")}</h1>
				</Panel>
			);
		}
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
				{this.renderPromoBanner(t)}
				<div className="top-ads">
					<AdContainer>
						<AdUnit id="fp-d-1" size="728x90" />
						<AdUnit id="fp-d-2" size="728x90" />
					</AdContainer>
				</div>
				<AdUnit id="fp-m-1" size="320x50" mobile />
				<div className="row content-row features">
					<GutterAdUnit position="left" id="fp-d-3" size="160x600" />
					<GutterAdUnit position="right" id="fp-d-4" size="160x600" />
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
						<AdUnit id="fp-m-2" size="300x250" mobile />
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
				<AdUnit id="fp-m-3" size="320x50" mobile />
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
					<GutterAdUnit position="left" id="fp-d-5" size="160x600" />
					<GutterAdUnit position="right" id="fp-d-6" size="160x600" />
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
								href="/downloads/"
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
								href="/downloads/"
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
					<div className="center-ads">
						<AdContainer>
							<AdUnit id="fp-d-11" size="728x90" />
							<AdUnit id="fp-d-12" size="728x90" />
						</AdContainer>
					</div>
					<AdUnit id="fp-m-4" size="320x50" mobile />
					<GutterAdUnit position="left" id="fp-d-7" size="160x600" />
					<GutterAdUnit position="right" id="fp-d-8" size="160x600" />
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
					<GutterAdUnit position="left" id="fp-d-9" size="160x600" />
					<GutterAdUnit
						position="right"
						id="fp-d-10"
						size="160x600"
					/>
					<AdUnit id="fp-m-5" size="320x50" mobile />
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
					<AdUnit id="fp-m-6" size="320x50" mobile />
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
					{t("GLOBAL_STANDARD")}
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
					{t("GLOBAL_WILD")}
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

	// Use memoize to prevent re-rendering random banners
	private renderPromoBanner = memoize((t: TranslationFunction) => {
		const banners = [];

		if (UserData.hasFeature("arcane-tracker")) {
			banners.push(
				<PromoBanner
					href="https://play.google.com/store/apps/details?id=net.mbonnin.arcanetracker"
					backgroundImage="https://media.hearthsim.net/hsreplaynet/android-banner.jpg"
					title={t("Hearthstone Deck Tracker now on Android")}
					subtitle={t("Don't you guys have phones?")}
					target="_blank"
				/>,
			);
		}

		if (UserData.hasFeature("twitch-vods")) {
			const seenDecks = UserData.hasCookie(
				"twitch-vods-decks-popup-closed",
				"0",
			);
			const seenArchetypes = UserData.hasCookie(
				"twitch-vods-archetypes-popup-closed",
				"0",
			);
			if (!seenDecks || !seenArchetypes) {
				const href = seenArchetypes
					? "/decks/wsEA4huCdRblzBiNfbreWf/#tab=vods"
					: "/archetypes/216/odd-paladin#&tab=vods";
				banners.push(
					<PromoBanner
						href={href}
						backgroundImage="https://media.hearthsim.net/hsreplaynet/vods-banner.jpg"
						title={t("Twitch VODs are now available!")}
						subtitle={t(
							"Watch the pros and become a better player!",
						)}
					/>,
				);
			}
		}

		if (UserData.hasFeature("careers-page")) {
			banners.push(
				<PromoBanner
					href={"https://hearthsim.net/careers.html"}
					backgroundImage="https://media.hearthsim.net/hsreplaynet/jobs-banner2.jpg"
					title={t("Everyone, get in here - we're hiring!")}
					subtitle={t("Click here to check out our current job openings")}
				/>,
			);
		}

		if (banners.length) {
			return banners[Math.floor(Math.random() * banners.length)];
		}
		return null;
	});
}

export default translate()(Home);
