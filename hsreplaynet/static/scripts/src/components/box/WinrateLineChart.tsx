import * as _ from "lodash";
import React from "react";
import { VictoryArea, VictoryAxis, VictoryChart } from "victory";
import { getChartMetaData, toTimeSeries } from "../../helpers";
import { RenderData } from "../../interfaces";
import WinLossGradient from "../charts/gradients/WinLossGradient";

interface Props {
	data?: RenderData;
	height: number;
	width: number;
}

export default class WinrateLineChart extends React.Component<Props> {
	private filterId = _.uniqueId("popularity-gradient-");

	public render(): React.ReactNode {
		const series = toTimeSeries(
			this.props.data.series.find(x => x.name === "winrates_over_time") ||
				this.props.data.series[0],
		);
		const metadata = getChartMetaData(series.data, 50, true, 10);

		const yTicks = [50];
		metadata.yDomain.forEach(
			value => yTicks.indexOf(value) === -1 && yTicks.push(value),
		);

		return (
			<div
				style={{
					height: `${this.props.height}px`,
					width: `${this.props.width}px`,
				}}
			>
				<VictoryChart
					height={this.props.height}
					width={this.props.width}
					padding={{ left: 0, top: 3, right: 0, bottom: 3 }}
					domain={{ x: metadata.xDomain, y: metadata.yDomain }}
				>
					<VictoryAxis
						scale="time"
						tickFormat={tick => ""}
						style={{
							grid: { stroke: "transparent" },
							axis: { visibility: "hidden" },
						}}
					/>
					<VictoryAxis
						dependentAxis
						tickFormat={tick => ""}
						style={{
							axis: { visibility: "hidden" },
							grid: { stroke: "transparent" },
						}}
					/>
					<defs>
						<WinLossGradient
							id={this.filterId}
							metadata={metadata}
						/>
					</defs>
					<VictoryArea
						data={series.data.map(p => {
							return { x: p.x, y: p.y, _y0: 50 };
						})}
						style={{
							data: {
								fill: `url(#${this.filterId})`,
								stroke: "black",
								strokeWidth: 1,
							},
						}}
						interpolation="monotoneX"
					/>
				</VictoryChart>
			</div>
		);
	}
}
