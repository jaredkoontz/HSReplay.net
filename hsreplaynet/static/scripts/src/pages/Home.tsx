import * as React from "react";
import CardData from "../CardData";
import ReplayFeed from "../components/home/ReplayFeed";
import DataInjector from "../components/DataInjector";
import ClassRanking from "../components/home/ClassRanking";
import ArchetypeHighlight from "../components/home/ArchetypeHighlight";
import LiveData from "../components/home/LiveData";
import { BnetGameType } from "../hearthstone";
import { showModal } from "../Premium";

interface Props {
	cardData: CardData | null;
}

interface State {
	gameType: BnetGameType;
	fullReplaySpeed: boolean;
}

export default class Home extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			gameType: BnetGameType.BGT_RANKED_STANDARD,
			fullReplaySpeed: false,
		};
	}

	render(): React.ReactNode {
		const bannerStyle = {
			backgroundImage: `url(${STATIC_URL}images/banner_art.jpg)`,
		};
		const archetypeDataQuery = {
			url: "/api/v1/archetypes",
			key: "archetypeData",
		};
		return (
			<div className="container-fluid">
				<div className="row" id="banner" style={bannerStyle}>
					<div id="banner-content">
						<span>Unleash your potential!</span>
					</div>
					<img
						id="banner-icon"
						src={`${STATIC_URL}images/premium.png`}
					/>
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
						<div className="feature feature-small">
							<div
								className="feature-content no-title"
								id="stats-feature"
							>
								<div className="feature-banner">
									<h1>Check your stats</h1>
									<h2>Replays and matchups</h2>
								</div>
							</div>
						</div>
					</div>
					<div className="col-lg-4 col-md-6 col-sm-6 col-xs-12">
						<div
							className="feature premium-feature"
							id="feature-best-deck"
						>
							<div className="feature-title">
								<span>Premium Feature</span>
								<a
									href="#"
									className="btn feature-btn"
									onClick={e => {
										e.preventDefault();
										showModal();
									}}
								>
									<span className="hidden-xs">
										Subscribe for full access
									</span>
									<span className="visible-xs">
										Subscribe
									</span>
								</a>
							</div>
							<div className="feature-content">
								<DataInjector query={archetypeDataQuery}>
									<ArchetypeHighlight
										cardData={this.props.cardData}
										data={[
											// {id: 1, rank: 2, region: "REGION_EU", winrate: 54.33},
											{
												id: 161,
												rank: 14,
												region: "REGION_US",
												winrate: 57.41,
											},
											// {id: 159, rank: 3, region: "REGION_KR", winrate: 54.64},
										]}
									/>
								</DataInjector>
							</div>
						</div>
						<div className="feature feature-small">
							<div
								className="feature-content no-title"
								id="premium-feature"
							>
								<div className="header-wrapper">
									<h1>HSReplay.net Premium</h1>
								</div>
								<div className="premium-banner">
									<ul className="hidden-xs">
										<li>Analyze live statistics</li>
										<li>Climb the ranked ladder</li>
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
					</div>
					<div className="col-lg-4 col-xs-12">
						<div className="feature" id="feature-class-ranking">
							<div className="feature-title">
								<span className="hidden-xs">
									Class Winrates
								</span>
								<span className="visible-xs">Classes</span>
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
						<div className="feature feature-small">
							<div
								className="feature-content no-title"
								id="collection-feature"
							>
								<div className="feature-banner">
									<h1>Collection Uploading</h1>
									<h2>Find the best decks for you</h2>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className="row" id="live-data">
					<LiveData cardData={this.props.cardData} numCards={12} />
				</div>
			</div>
		);
	}
}
