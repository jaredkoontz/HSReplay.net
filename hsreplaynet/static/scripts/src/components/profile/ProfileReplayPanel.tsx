import React from "react";
import { ProfileGameData } from "./ProfileArchetypeList";
import { InjectedTranslateProps } from "react-i18next";
import { translate } from "../../__mocks__/react-i18next";
import { getCardClassName } from "../../helpers";
import SemanticAge from "../text/SemanticAge";
import { formatNumber } from "../../i18n";

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
			<li>
				<div className="data-container">
					<div className="col-lg-1" />
					<div className="col-lg-1">
						{data.won ? t("Won") : t("Lost")}
					</div>
					<div className="col-lg-2">
						<p
							className={`player-class ${opponentClass.toLowerCase()}`}
						>
							{data.opponentArchetype
								? data.opponentArchetype.name
								: opponentClass}
						</p>
					</div>
					<div className="col-lg-1">
						{data.rank
							? t("Rank {rank}", { rank: data.rank })
							: t("Legend {rank}", { rank: data.legendRank })}
					</div>
					<div className="col-lg-1">{data.numTurns}</div>
					<div className="col-lg-1">
						<SemanticAge date={data.date} />
					</div>
					<div className="col-lg-1">
						{t("{durationInMinutes} min", {
							durationInMinutes: formatNumber(
								data.duration / 1000 / 60,
								1,
							),
						})}
					</div>
					<div className="col-lg-1" />
				</div>
			</li>
		);
	}
}

export default translate()(ProfileReplayPanel);
