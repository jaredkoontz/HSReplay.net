import React from "react";
import ProfileReplayPanel from "./ProfileReplayPanel";
import { ProfileGameData } from "./ProfileArchetypeList";
import CardData from "../../CardData";
import { WithTranslation, withTranslation } from "react-i18next";

interface Props extends WithTranslation {
	data: ProfileGameData[];
	cardData: CardData;
	gameType: string;
}

class ProfileReplayList extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t } = this.props;
		return (
			<ul className="col-lg-12">
				<div className="profile-replay-list-header col-lg-12">
					<div className="replay-spacer col-lg-1 col-md-1 hidden-sm hidden-xs" />
					<div className="col-lg-1 col-md-1 col-sm-2 col-xs-3">
						{t("Result")}
					</div>
					<div className="col-lg-2 col-md-2 col-sm-3 col-xs-6 align-left">
						{t("Opponent")}
					</div>
					<div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">
						{t("Rank")}
					</div>
					<div className="col-lg-2 col-md-2 col-sm-3 hidden-xs">
						{t("Date")}
					</div>
					<div className="col-lg-1 col-md-1 hidden-sm hidden-xs">
						{t("Turns")}
					</div>
					<div className="col-lg-1 col-md-1 hidden-sm hidden-xs">
						{t("Duration")}
					</div>
					<div className="col-lg-2 col-md-2 col-sm-2 col-xs-3">
						{t("Replay")}
					</div>
				</div>
				<div className="clearfix" />
				{this.props.data.map(game => (
					<ProfileReplayPanel
						data={game}
						cardData={this.props.cardData}
						gameType={this.props.gameType}
					/>
				))}
			</ul>
		);
	}
}

export default withTranslation()(ProfileReplayList);
