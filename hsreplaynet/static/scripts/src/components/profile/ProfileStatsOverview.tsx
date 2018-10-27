import React from "react";
import RankIcon from "../RankIcon";
import { BnetGameType } from "../../hearthstone";
import { winrateData } from "../../helpers";
import { formatNumber } from "../../i18n";
import { InjectedTranslateProps, translate } from "react-i18next";
import ClassIcon from "../ClassIcon";

interface Props extends InjectedTranslateProps {
	rank: number | null;
	legendRank: number | null;
	games: number;
	winrate: number | null;
	favoriteClass: string | null;
}

class ProfileStatsOverview extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t, winrate, favoriteClass } = this.props;
		const wrData = winrate !== null && winrateData(50, winrate, 2);
		return (
			<div className="profile-stats-overview">
				<div className="rank-icon-container">
					<RankIcon
						legendRank={this.props.legendRank}
						rank={this.props.rank}
						gameType={BnetGameType.BGT_RANKED_STANDARD}
					/>
				</div>
				<dl>
					<dt>{t("Games Played:")}</dt>
					<dd>{this.props.games}</dd>
					<dt>{t("Winrate:")}</dt>
					{winrate != null ? (
						<dd style={{ color: wrData.color }}>
							{formatNumber(winrate, 1)}%
						</dd>
					) : (
						<dd>-</dd>
					)}
					<dt>{t("Favorite Class:")}</dt>
					<dd>
						{favoriteClass != null ? (
							<ClassIcon cardClass={favoriteClass} tooltip />
						) : (
							"-"
						)}
						{}
					</dd>
				</dl>
			</div>
		);
	}
}

export default translate()(ProfileStatsOverview);
