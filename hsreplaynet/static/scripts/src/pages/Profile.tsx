import React from "react";
import scrollbarSize from "dom-helpers/util/scrollbarSize";
import { InjectedTranslateProps, translate } from "react-i18next";
import CardData from "../CardData";
import { Archetype } from "../utils/api";
import RankIcon from "../components/RankIcon";
import ProfileHero from "../components/profile/ProfileHero";
import ProfileHighlight from "../components/profile/ProfileHighlight";
import { BnetGameType } from "../hearthstone";
import ProfileData, { ReplayData } from "../components/profile/ProfileData";
import LoadingSpinner from "../components/LoadingSpinner";
import ArchetypeMatrix from "../components/metaoverview/matchups/ArchetypeMatrix";
import Tab from "../components/layout/Tab";
import TabList from "../components/layout/TabList";

interface Props extends InjectedTranslateProps {
	cardData: CardData;
	archetypeData: Archetype[];
	username: string;
	userId: number;
	statsTimeFrame?: string;
	setStatsTimeFrame?: (statsTimeFrame: string) => void;
	gameType?: string;
	setGameType?: (gameType: string) => void;
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
						<h1>
							{t("Stats")}
							{/*TODO: Dropdown*/}
						</h1>
						<h3>{t("Archetype Matchups")}</h3>
						{this.renderMatchupMatrix()}
					</Tab>
					<Tab id={"RANKED_WILD"} label={"Ranked Wild"} disabled />
					<Tab id={"ARENA"} label={"Arena"} disabled />
				</TabList>
			</main>
		);
	}

	private getTimeFrameStart(): Date {
		// TODO: Change this to be based on server time
		const now = new Date();
		switch (this.props.statsTimeFrame) {
			case "CURRENT_SEASON": {
				return new Date(now.getFullYear(), now.getMonth(), 1);
			}
		}
		return null;
	}

	private isValidTimeFrame(replay: ReplayData): boolean {
		const timeFrameStart = this.getTimeFrameStart();
		if (timeFrameStart === null) {
			return false;
		}
		const matchStart = Date.parse(replay.match_start);
		return matchStart >= timeFrameStart.getTime();
	}

	private renderMatchupMatrix(): React.ReactNode {
		const { t } = this.props;
		const cellWidth = 90;
		const cellHeight = 50;
		return (
			<ProfileData
				userId={this.props.userId}
				type="MatchupData"
				replayFilter={replay =>
					replay.game_type === BnetGameType.BGT_RANKED_STANDARD &&
					this.isValidTimeFrame(replay)
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
