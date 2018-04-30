import React from "react";
import PropMultiplexer from "./PropMultiplexer";
import HighlightPointComponent from "./HighlightPointComponent";
import { Flyout, VictoryLabel, VictoryTooltip } from "victory";

interface Props {
	xCenter: number;
	sizeFactor?: number;
}

export default class ChartHighlighter extends React.Component<Props> {
	public render(): React.ReactNode {
		const factor = this.props.sizeFactor || 1;
		return React.cloneElement(<PropMultiplexer />, this.props, [
			<HighlightPointComponent sizeFactor={factor} />,
			<VictoryTooltip
				cornerRadius={0}
				pointerLength={0}
				padding={0}
				orientation={d => (d.x > this.props.xCenter ? "left" : "right")}
				dx={8}
				style={{
					fill: "white",
					fontSize: 6 * factor,
					padding: 5 * factor,
				}}
				flyoutStyle={{
					fill: "rgba(0, 0, 0, 0.8)",
					stroke: "white",
					strokeWidth: 0,
				}}
				activateData
				labelComponent={<VictoryLabel dy={8} />}
				flyoutComponent={<Flyout dy={-8} />}
			/>,
		]);
	}
}
