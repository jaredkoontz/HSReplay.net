import React from "react";
import ProfileReplayPanel from "./ProfileReplayPanel";
import { ProfileGameData } from "./ProfileArchetypeList";
import CardData from "../../CardData";
import { InjectedTranslateProps, translate } from "react-i18next";

interface Props extends InjectedTranslateProps {
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
					<div className="replay-spacer col-lg-1 col-md-1 col-sm-hidden col-xs-hidden" />
					<div className="col-lg-1 col-md- col-sm-2 col-xs-2">
						{t("Result")}
					</div>
					<div className="col-lg-2 col-md-2 col-sm-2 col-xs-2 align-left">
						{t("Opponent")}
					</div>
					<div className="col-lg-2 col-md-2 col-sm-2 col-xs-2">
						{t("Rank")}
					</div>
					<div className="col-lg-2 col-md-2 col-sm-2 col-xs-2">
						{t("Date")}
					</div>
					<div className="col-lg-1 col-md-2 col-sm-1 col-xs-hidden">
						{t("Turns")}
					</div>
					<div className="col-lg-1 col-md-1 col-sm-1 col-xs-hidden">
						{t("Duration")}
					</div>
					<div className="col-lg-2 col-md-1 col-sm-1 col-xs-hidden">
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

export default translate()(ProfileReplayList);
