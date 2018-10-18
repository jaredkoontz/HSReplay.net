import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import CardData from "../CardData";
import { Archetype } from "../utils/api";
import RankIcon from "../components/RankIcon";
import ProfileHero from "../components/profile/ProfileHero";
import ProfileHighlight from "../components/profile/ProfileHighlight";
import { BnetGameType } from "../hearthstone";
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
