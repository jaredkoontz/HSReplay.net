import React from "react";
import { BnetGameType } from "../hearthstone";
import { image } from "../helpers";

interface Props {
	gameType?: BnetGameType;
	rank?: number;
	legendRank?: number;
}

export default class RankIcon extends React.Component<Props> {
	public render(): React.ReactNode {
		let altText = null;
		let imgPath = null;
		if (
			[
				BnetGameType.BGT_RANKED_STANDARD,
				BnetGameType.BGT_RANKED_WILD,
			].indexOf(this.props.gameType) !== -1
		) {
			if (this.props.rank) {
				imgPath = `ranked-medals/Medal_Ranked_${this.props.rank}.png`;
				altText = "Ranked";
			}
			if (this.props.legendRank) {
				imgPath = "ranked-medals/Medal_Ranked_Legend.png";
				altText = `Legend ${+this.props.legendRank}`;
			}
		} else {
			return null;
		}

		return (
			<figure className="rank-icon-standalone">
				<img src={image(imgPath)} alt={altText} />
				<figcaption>
					{this.props.legendRank
						? this.props.legendRank
						: this.props.rank}
				</figcaption>
			</figure>
		);
	}
}
