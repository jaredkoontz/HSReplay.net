import * as React from "react";
import CardData from "../CardData";
import ReplayFeed from "../components/home/ReplayFeed";
import DataInjector from "../components/DataInjector";
import ClassRanking from "../components/home/ClassRanking";
import ArchetypeHighlight from "../components/home/ArchetypeHighlight";
import LiveData from "../components/home/LiveData";
import FAQ from "../components/home/FAQ";
import { BnetGameType } from "../hearthstone";
import { showModal } from "../Premium";
import FeaturePanel from "../components/home/FeaturePanel";
import Modal from "../components/Modal";
import CollectionSetup from "../components/collection/CollectionSetup";
import UserData from "../UserData";
import ModeSvg from "../components/ModeSvg";

interface Props {
	cardData: CardData | null;
}

interface State {
	gameType: BnetGameType;
	fullReplaySpeed: boolean;
	showCollectionModal: boolean;
}

export default class Home extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			gameType: BnetGameType.BGT_RANKED_STANDARD,
			fullReplaySpeed: false,
			showCollectionModal: false,
		};
	}

	renderCollectionModal(): React.ReactNode {
		if (!this.state.showCollectionModal) {
			return null;
		}
		const onClose = () => this.setState({ showCollectionModal: false });
		return (
			<Modal onClose={onClose}>
				<CollectionSetup />
			</Modal>
		);
	}

	renderPremiumFeatureButton(): React.ReactNode {
		if (UserData.isPremium()) {
			return null;
		}
		return (
			<a
				href="#"
				className="btn feature-btn"
				onClick={e => {
					e.preventDefault();
					showModal();
				}}
			>
				<span className="hidden-xs">Subscribe for full access</span>
				<span className="visible-xs">Subscribe</span>
			</a>
		);
	}

	renderPremiumPanel(): React.ReactNode {
		if (UserData.isPremium()) {
			return (
				<FeaturePanel
					title="My Decks"
					subtitle="Check out statistics about your decks"
					backgroundCardId="KARA_00_07"
					backgroundStyle={{
						backgroundPositionY: "30%",
					}}
					href="/decks/mine/"
				/>
			);
		}
		return (
			<div className="feature feature-small">
				<div className="feature-content no-title" id="premium-feature">
					<div className="header-wrapper">
						<h1>HSReplay.net Premium</h1>
					</div>
					<div className="premium-banner">
						<ul className="hidden-xs">
							<li>Climb the ranked ladder</li>
							<li>Analyze live statistics</li>
							<li>Counter the meta</li>
						</ul>
						<div className="btn-wrapper">
							<a
								className="btn promo-button blue-style"
								href="/premium"
							>
								Learn more
							</a>
							<a
								className="btn promo-button"
								href="#"
								onClick={e => {
									e.preventDefault();
									showModal();
								}}
							>
								Subscribe
							</a>
						</div>
					</div>
				</div>
			</div>
		);
	}

	render(): React.ReactNode {
		const bannerStyle = {
			backgroundImage: `url(${STATIC_URL}images/banner.jpg)`,
		};
		const archetypeDataQuery = {
			url: "/api/v1/archetypes",
			key: "archetypeData",
		};
		const ranks = Array.from(Array(9).keys()).map(n => {
			const image =
				n === 0
					? "banner-legend.png"
					: `ranked-medals/Medal_Ranked_${n}.png`;
			return <img key={n} src={`${STATIC_URL}images/${image}`} />;
		});
		ranks.reverse();
		return (
			<div className="container-fluid">
				<div className="row" id="banner" style={bannerStyle}>
					<div id="banner-wrapper">
						<div id="banner-text">
							<h1>Unleash your potential</h1>
							<h2 className="hidden-xs">
								Find the best deck for your rank and region
							</h2>
						</div>
						<div id="banner-ranks">{ranks}</div>
					</div>
				</div>
				<div className="row features">
					<div className="col-lg-4 col-md-6 col-sm-6 col-xs-12">
						<div className="feature" id="feature-live-data">
							<div className="feature-title">
								<span>Live Data</span>
								<a
									href="#"
									className={
										"btn feature-btn" +
										(this.state.fullReplaySpeed
											? " active"
											: "")
									}
									onClick={e => {
										this.setState({
											fullReplaySpeed: !this.state
												.fullReplaySpeed,
										});
									}}
								>
									<span>Full speed</span>
								</a>
							</div>
							<div className="feature-content">
								<DataInjector
									query={[
										archetypeDataQuery,
										{
											url: "/live/games_count/weekly/",
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
							</div>
						</div>
						<FeaturePanel
							title="Replays"
							subtitle="Watch and share your games"
							backgroundCardId="PART_002"
							href="/games/mine/"
						/>
					</div>
					<div className="col-lg-4 col-md-6 col-sm-6 col-xs-12">
						<div
							className="feature premium-feature"
							id="feature-best-deck"
						>
							<div className="feature-title">
								<span>Premium Feature</span>
								{this.renderPremiumFeatureButton()}
							</div>
							<div className="feature-content">
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
							</div>
						</div>
						{this.renderPremiumPanel()}
					</div>
					<div className="col-lg-4 col-xs-12">
						<div className="feature" id="feature-class-ranking">
							<div className="feature-title">
								<span className="hidden-xs">
									Class Winrates
								</span>
								<span className="visible-xs">Winrates</span>
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
											gameType:
												BnetGameType.BGT_RANKED_STANDARD,
										});
									}}
								>
									<ModeSvg type="standard" />
									Standard
								</a>
								<a
									className={
										"btn feature-btn " +
										(this.state.gameType ===
										BnetGameType.BGT_RANKED_WILD
											? "active"
											: "")
									}
									onClick={e => {
										e.preventDefault();
										this.setState({
											gameType:
												BnetGameType.BGT_RANKED_WILD,
										});
									}}
								>
									<ModeSvg type="wild" />
									Wild
								</a>
								<a
									className={
										"btn feature-btn " +
										(this.state.gameType ===
										BnetGameType.BGT_ARENA
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
									Arena
								</a>
							</div>
							<div className="feature-content">
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
									<ClassRanking
										gameType={this.state.gameType}
									/>
								</DataInjector>
							</div>
						</div>
						{this.renderCollectionModal()}
						<FeaturePanel
							title="Collection Uploading"
							subtitle="Find the best decks for your collection"
							backgroundCardId="LOOTA_814"
							onClick={e => {
								e.preventDefault();
								this.setState({ showCollectionModal: true });
							}}
						/>
					</div>
				</div>
				<div className="row" id="live-data">
					<LiveData cardData={this.props.cardData} numCards={12} />
				</div>
				<div className="row" id="faq">
					<FAQ />
				</div>
			</div>
		);
	}
}
