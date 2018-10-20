import React from "react";
import { ProfileDeckData } from "./ProfileArchetypeList";
import CardData from "../../CardData";
import ProfileReplayList from "./ProfileReplayList";
import { formatNumber } from "../../i18n";
import SemanticAge from "../text/SemanticAge";
import CardIcon from "../CardIcon";

interface Props {
	data: ProfileDeckData;
	cardData: CardData;
}

interface State {
	expanded: boolean;
}

export default class ProfileDeckPanel extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			expanded: false,
		};
	}

	public render(): React.ReactNode {
		return (
			<li>
				<div className="data-container">
					<div className="col-lg-1" />
					<div className="col-lg-2">
						<a
							href="#"
							onClick={e => {
								e.preventDefault();
								this.setState({
									expanded: !this.state.expanded,
								});
							}}
						>
							View Games
						</a>
					</div>
					<div className="col-lg-1">
						<p>
							{formatNumber(
								100 *
									this.props.data.numWins /
									this.props.data.numGames,
								1,
							)}%
						</p>
						{this.props.data.globalWinrate ? (
							<p>
								Avg.{" "}
								{formatNumber(this.props.data.globalWinrate, 1)}%
							</p>
						) : null}
					</div>
					<div className="col-lg-1">{this.props.data.numGames}</div>
					<div className="col-lg-1">
						<SemanticAge date={this.props.data.lastPlayed} />
					</div>
					<div className="col-lg-6">
						<div className="card-list-container">
							{this.props.data.archetype.standard_ccp_signature_core.components.map(
								dbfId => (
									<CardIcon
										card={this.props.cardData.fromDbf(
											dbfId,
										)}
									/>
								),
							)}
						</div>
					</div>
				</div>
				{this.state.expanded ? (
					<ProfileReplayList data={this.props.data.games} />
				) : null}
				<div className="clearfix" />
			</li>
		);
	}
}
