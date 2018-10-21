import React from "react";
import { ProfileGameData } from "./ProfileArchetypeList";
import { InjectedTranslateProps } from "react-i18next";
import { translate } from "../../__mocks__/react-i18next";
import { getCardClassName } from "../../helpers";
import SemanticAge from "../text/SemanticAge";
import { formatNumber } from "../../i18n";
import RankIcon from "../RankIcon";
import { BnetGameType } from "../../hearthstone";

interface Props extends InjectedTranslateProps {
	data: ProfileGameData;
}

interface State {}

class ProfileReplayPanel extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {};
	}

	public render(): React.ReactNode {
		const { data, t } = this.props;
		const opponentClass = getCardClassName(data.opponentPlayerClass);
		return (
			<li className="profile-replay-panel">
				<div className="data-container">
					<div
						className="col-lg-1 col-lg-offset-1"
						style={{
							color: data.won ? "green" : "red",
							textTransform: "uppercase",
						}}
					>
						{data.won ? t("Win") : t("Loss")}
					</div>
					<div className="col-lg-2 align-left">
						<p
							className={`player-class ${opponentClass.toLowerCase()}`}
						>
							{data.opponentArchetype
								? data.opponentArchetype.name
								: opponentClass}
						</p>
					</div>
					<div className="col-lg-2">
						{data.rank || data.legendRank ? (
							<>
								<RankIcon
									rank={data.rank}
									legendRank={data.legendRank}
									gameType={BnetGameType.BGT_RANKED_STANDARD}
								/>
								{data.rank
									? t("Rank {rank}", { rank: data.rank })
									: t("Legend {rank}", {
											rank: data.legendRank,
									  })}
							</>
						) : null}
					</div>
					<div className="col-lg-2">
						<SemanticAge date={data.date} />
					</div>
					<div className="col-lg-1">{data.numTurns}</div>
					<div className="col-lg-1">
						{t("{durationInMinutes} min", {
							durationInMinutes: formatNumber(
								data.duration / 1000 / 60,
								1,
							),
						})}
					</div>
					<div className="col-lg-2" />
				</div>
				<div className="clearfix" />
			</li>
		);
	}
}

export default translate()(ProfileReplayPanel);
