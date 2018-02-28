import React from "react";
import { toDynamicFixed } from "../../../helpers";

interface Props {
	popularity: number;
	maxPopularity: number;
	style?: any;
}

export default class PopularityCell extends React.Component<Props> {
	public render(): React.ReactNode {
		const classNames = ["matchup-cell"];
		const lightness =
			45 +
			Math.floor(
				55 *
					Math.max(
						0,
						1 -
							(this.props.popularity || 0) /
								this.props.maxPopularity,
					),
			);
		const color = lightness > 60 ? "black" : "white";
		const backgroundColor = `hsl(214,50%,${lightness}%)`;

		return (
			<div
				className={classNames.join(" ")}
				style={{ color, backgroundColor, ...this.props.style }}
			>
				{this.props.popularity
					? toDynamicFixed(this.props.popularity, 2)
					: 0}%
			</div>
		);
	}
}
