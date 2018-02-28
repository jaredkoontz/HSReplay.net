import React from "react";
import { ChartMetaData } from "../../../interfaces";

interface Props {
	metadata: ChartMetaData;
	id: string;
}

export default class WinLossGradient extends React.Component<Props> {
	public render(): React.ReactNode {
		const gradientStops = [];
		if (this.props.metadata.yMinMax[1].y > 50) {
			gradientStops.push(
				<stop stopColor="rgba(0, 200, 0, 0.3)" offset={0} />,
			);
		}
		gradientStops.push(
			<stop
				stopColor="rgba(255, 255, 255, 0)"
				offset={this.props.metadata.midLinePosition}
			/>,
		);
		if (this.props.metadata.yMinMax[0].y < 50) {
			gradientStops.push(
				<stop stopColor="rgba(200, 0, 0, 0.3)" offset={1} />,
			);
		}
		return (
			<linearGradient
				id={this.props.id}
				x1="50%"
				y1="0%"
				x2="50%"
				y2="100%"
			>
				{gradientStops}
			</linearGradient>
		);
	}
}
