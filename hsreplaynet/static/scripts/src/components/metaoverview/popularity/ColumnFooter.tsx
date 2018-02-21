import React from "react";
import { commaSeparate } from "../../../helpers";

interface Props {
	games: number;
	maxGames?: number;
	style?: any;
}

export default class ColumnFooter extends React.Component<Props> {
	public render(): React.ReactNode {
		const lightness =
			45 +
			Math.floor(
				55 *
					Math.max(
						0,
						1 - (this.props.games || 0) / this.props.maxGames
					)
			);
		const color = lightness > 60 ? "black" : "white";
		const backgroundColor = `hsl(214,50%,${lightness}%)`;

		return (
			<div
				className="matchup-column-footer matchup-column-footer-games popularity-column-footer"
				style={{ color, backgroundColor, ...this.props.style }}
			>
				{commaSeparate(this.props.games)}
			</div>
		);
	}
}
