import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import CardData from "../CardData";
import { Archetype } from "../utils/api";
import RankIcon from "../components/RankIcon";
import ProfileHero from "../components/profile/ProfileHero";
import ProfileHighlight from "../components/profile/ProfileHighlight";
import { BnetGameType } from "../hearthstone";

interface Props extends InjectedTranslateProps {
	cardData: CardData;
	archetypeData: Archetype[];
	username: string;
}
interface State {}

class Profile extends React.Component<Props, State> {
	public render(): React.ReactNode {
		const { t } = this.props;
		return <>{this.renderHeader()}</>;
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
