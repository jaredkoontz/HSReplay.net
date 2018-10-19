import React from "react";
import { BnetGameType } from "../hearthstone";
import { image } from "../helpers";
import Tooltip from "./Tooltip";
import { InjectedTranslateProps, translate } from "react-i18next";

interface Props extends InjectedTranslateProps {
	gameType?: BnetGameType;
	rank?: number;
	legendRank?: number;
	tooltip?: boolean;
}

class RankIcon extends React.Component<Props> {
	public render(): React.ReactNode {
		const { rank, legendRank, t } = this.props;
		let altText = null;
		let imgPath = null;
		if (
			[
				BnetGameType.BGT_RANKED_STANDARD,
				BnetGameType.BGT_RANKED_WILD,
			].indexOf(this.props.gameType) !== -1
		) {
			if (rank) {
				imgPath = `ranked-medals/Medal_Ranked_${rank}.png`;
				altText = t("Rank {rank}", { rank });
			}
			if (legendRank) {
				imgPath = "ranked-medals/Medal_Ranked_Legend.png";
				altText = t("Legend {rank}", { rank: legendRank });
			}
		} else {
			return null;
		}

		const result = (
			<figure className="rank-icon-standalone">
				<img src={image(imgPath)} alt={altText} />
				<figcaption>{legendRank ? legendRank : rank}</figcaption>
			</figure>
		);

		if (this.props.tooltip) {
			return (
				<Tooltip content={altText} simple>
					{result}
				</Tooltip>
			);
		}

		return result;
	}
}

export default translate()(RankIcon);
