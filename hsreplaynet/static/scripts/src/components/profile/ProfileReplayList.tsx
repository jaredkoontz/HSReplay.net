import React from "react";
import ProfileReplayPanel from "./ProfileReplayPanel";
import { ProfileGameData } from "./ProfileArchetypeList";
import CardData from "../../CardData";

interface Props {
	data: ProfileGameData[];
	cardData: CardData;
	gameType: string;
}

export default class ProfileReplayList extends React.Component<Props> {
	public render(): React.ReactNode {
		return (
			<ul className="col-lg-12">
				<div className="profile-replay-list-header col-lg-12">
					<div className="col-lg-1 col-lg-offset-1 col-md-2 col-md-offset-1 col-sm-2 col-xs-2">
						Result
					</div>
					<div className="col-lg-2 col-md-2 col-sm-2 col-xs-2 align-left">
						Opponent
					</div>
					<div className="col-lg-2 col-md-2 col-sm-2 col-xs-2">
						Rank
					</div>
					<div className="col-lg-2 col-md-2 col-sm-2 col-xs-2">
						Date
					</div>
					<div className="col-lg-1 col-md-2 col-sm-1 col-xs-hidden">
						Turns
					</div>
					<div className="col-lg-1 col-md-1 col-sm-1 col-xs-hidden">
						Duration
					</div>
					<div className="col-lg-2 col-md-1 col-sm-1 col-xs-hidden">
						Replay
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
