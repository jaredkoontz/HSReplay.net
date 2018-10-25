import React from "react";
import scrollbarSize from "dom-helpers/util/scrollbarSize";
import { InjectedTranslateProps, translate } from "react-i18next";
import CardData from "../CardData";
import { Archetype } from "../utils/api";
import RankIcon from "../components/RankIcon";
import ProfileHero from "../components/profile/ProfileHero";
import ProfileHighlight from "../components/profile/ProfileHighlight";
import { BnetGameType } from "../hearthstone";
import ProfileData from "../components/profile/ProfileData";
import LoadingSpinner from "../components/LoadingSpinner";
import ArchetypeMatrix from "../components/metaoverview/matchups/ArchetypeMatrix";
import Tab from "../components/layout/Tab";
import TabList from "../components/layout/TabList";
import ProfileArchetypeList from "../components/profile/ProfileArchetypeList";
import OptionalSelect from "../components/OptionalSelect";
import { prettyTimeRange } from "../components/text/PrettyTimeRange";
import WinrateChart from "../components/profile/charts/WinrateChart";
import { subDays } from "date-fns";

interface Props extends InjectedTranslateProps {
	cardData: CardData;
	archetypeData: Archetype[];
	username: string;
	userId: number;
	statsTimeFrame?: string;
	setStatsTimeFrame?: (statsTimeFrame: string) => void;
	gameType?: string;
	setGameType?: (gameType: string) => void;
	overallStatsResolution?: string;
	setOverallStatsResolution?: (overallStatsResolution: string) => void;
}
interface State {}

class Profile extends React.Component<Props, State> {
	public render(): React.ReactNode {
		const { t } = this.props;
		return (
			<>
				{this.renderHeader()}
				{this.renderMain()}
			</>
		);
	}

	private renderMain(): React.ReactNode {
		const { t } = this.props;
		return (
			<main>
				<TabList
					tab={this.props.gameType}
					setTab={tab => this.props.setGameType(tab)}
				>
					<Tab id={"RANKED_STANDARD"} label={"Ranked Standard"}>
						<div className="profile-section">
							<div className="stats-header">
								<h1>{t("Stats")}</h1>
								<OptionalSelect
									default={prettyTimeRange(
										"CURRENT_SEASON",
										t,
									)}
									defaultKey={"CURRENT_SEASON"}
									options={{
										PREVIOUS_SEASON: prettyTimeRange(
											"PREVIOUS_SEASON",
											t,
										),
									}}
									value={this.props.statsTimeFrame}
									onSelect={value =>
										this.props.setStatsTimeFrame(value)
									}
								/>
							</div>
						</div>
						<section className="profile-section">
							<h2>{t("Archetypes Played")}</h2>
							{this.renderArchetypeList()}
							<h3>{t("Archetype Matchups")}</h3>
							{this.renderMatchupMatrix()}
						</section>
						<section className="profile-section profile-section-white">
							<h2 id="overall-stats">{t("Overall Stats")}</h2>
							{this.renderOverallStats()}
						</section>
					</Tab>
					<Tab id={"RANKED_WILD"} label={"Ranked Wild"} disabled />
					<Tab id={"ARENA"} label={"Arena"} disabled />
				</TabList>
			</main>
		);
	}

	private renderArchetypeList(): React.ReactNode {
		const [startDate, endDate] = this.getTimeFrame();
		if (!startDate || !endDate) {
			console.error("Invalid timeframe " + this.props.statsTimeFrame);
			return null;
		}
		return (
			<ProfileData
				cardData={this.props.cardData}
				userId={this.props.userId}
				type="ArchetypeListData"
				replayStartDate={startDate.toISOString()}
				replayEndDate={endDate.toISOString()}
				replayFilter={replay =>
					replay.game_type === BnetGameType.BGT_RANKED_STANDARD
				}
			>
				{data => {
					if (!data || !this.props.cardData) {
						return (
							<div
								className="archetype-list-wrapper"
								style={{ height: 200, width: 200 }}
							>
								<LoadingSpinner active />
							</div>
						);
					}
					return (
						<ProfileArchetypeList
							data={data}
							cardData={this.props.cardData}
							gameType={this.props.gameType}
						/>
					);
				}}
			</ProfileData>
		);
	}

	private getTimeFrame(): [Date, Date] {
		// TODO: Change this to be based on server time
		const now = new Date();
		const endOfDay = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			23,
			59,
			59,
		);
		switch (this.props.statsTimeFrame) {
			case "CURRENT_SEASON": {
				return [
					new Date(now.getFullYear(), now.getMonth(), 1),
					endOfDay,
				];
			}
			case "PREVIOUS_SEASON": {
				return [
					new Date(now.getFullYear(), now.getMonth() - 1, 1),
					new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, -1),
				];
			}
		}
		return [null, null];
	}

	private renderOverallStats(): React.ReactNode {
		const { t } = this.props;
		const unixEpoch = new Date(0);
		const now = new Date();
		const endOfDay = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			23,
			59,
			59,
			999,
		);
		const ninetyDaysAgo = subDays(endOfDay, 90);
		return (
			<div className="profile-stats">
				<ProfileData
					cardData={this.props.cardData}
					userId={this.props.userId}
					type="WinrateData"
					replayStartDate={unixEpoch.toISOString()}
					replayFilter={replay =>
						replay.game_type === BnetGameType.BGT_RANKED_STANDARD
					}
				>
					{data => {
						if (!data) {
							return <LoadingSpinner active />;
						}
						return (
							<WinrateChart
								caption={t("Overall Winrate")}
								aggregate={"BY_SEASON" as any}
								averageWinrate={data.averageWinrate}
								data={data}
							/>
						);
					}}
				</ProfileData>
				<ProfileData
					cardData={this.props.cardData}
					userId={this.props.userId}
					type="WinrateData"
					replayStartDate={ninetyDaysAgo.toISOString()}
					replayFilter={replay =>
						replay.game_type === BnetGameType.BGT_RANKED_STANDARD
					}
				>
					{data => {
						if (!data) {
							return <LoadingSpinner active />;
						}
						return (
							<WinrateChart
								caption={t("Overall Winrate")}
								aggregate={"BY_DAY" as any}
								averageWinrate={data.averageWinrate}
								data={data}
							/>
						);
					}}
				</ProfileData>
			</div>
		);
	}

	private renderMatchupMatrix(): React.ReactNode {
		const { t } = this.props;
		const cellWidth = 90;
		const cellHeight = 50;
		const [startDate, endDate] = this.getTimeFrame();
		if (!startDate || !endDate) {
			console.error("Invalid timeframe " + this.props.statsTimeFrame);
			return null;
		}
		return (
			<ProfileData
				cardData={this.props.cardData}
				userId={this.props.userId}
				type="MatchupData"
				replayStartDate={startDate.toISOString()}
				replayEndDate={endDate.toISOString()}
				replayFilter={replay =>
					replay.game_type === BnetGameType.BGT_RANKED_STANDARD
				}
			>
				{data => {
					if (
						!this.props.archetypeData ||
						!this.props.cardData ||
						!data
					) {
						return (
							<div
								className="archetype-matrix-wrapper"
								style={{ height: 200, width: 200 }}
							>
								<LoadingSpinner active />
							</div>
						);
					}
					if (
						!data.friendlyArchetypeIds.length ||
						!data.opposingArchetypeIds.length
					) {
						return (
							<div
								className="archetype-matrix-wrapper"
								style={{ height: 200 }}
							>
								<h3>{t("No data available")}</h3>
							</div>
						);
					}
					return (
						<div
							className="archetype-matrix-wrapper"
							style={{
								height:
									100 +
									scrollbarSize() +
									data.friendlyArchetypeIds.length *
										cellHeight +
									5,
							}}
						>
							<ArchetypeMatrix
								archetypeMatchups={data.matchups}
								friendlyArchetypes={data.friendlyArchetypeIds}
								opposingArchetypes={data.opposingArchetypeIds}
								allArchetypes={this.props.archetypeData}
								cardData={this.props.cardData}
								customWeights={{}}
								onCustomWeightsChanged={() => null}
								useCustomWeights={false}
								onUseCustomWeightsChanged={() => null}
								favorites={[]}
								gameType="RANKED_STANDARD"
								ignoredColumns={[]}
								onFavoriteChanged={() => null}
								onIgnoreChanged={() => null}
								onSortChanged={() => null}
								sortBy="name"
								sortDirection="ascending"
								simple
								minGames={1}
								ignoreMirror
								columnHeaderLinks
								cellWidth={cellWidth}
								cellHeight={cellHeight}
								cellColorStyle={"text"}
							/>
						</div>
					);
				}}
			</ProfileData>
		);
	}

	private renderHeader(): React.ReactNode {
		const { t } = this.props;
		return (
			<header>
				<ProfileHero name={this.props.username} cardId="Mekka1" />
				<div className="career-highlights">
					<h3>{t("Career highlights")}</h3>
					<div>
						<ProfileHighlight
							header="Ranked Standard"
							subtitle="March 2017"
							highlight={
								<RankIcon
									legendRank={42}
									gameType={BnetGameType.BGT_RANKED_STANDARD}
								/>
							}
						/>
						<ProfileHighlight
							header="Arena"
							subtitle="May 2016"
							highlight="11-3"
						/>
						<ProfileHighlight
							header="Games Played"
							subtitle="66% Arena"
							highlight="15.7k"
						/>
						<ProfileHighlight
							header="Collection"
							subtitle="15% Golden"
							highlight="58%"
						/>
						<ProfileHighlight
							header="Collection"
							subtitle="15% Golden"
							highlight="58%"
						/>
					</div>
				</div>
			</header>
		);
	}
}

export default translate()(Profile);
