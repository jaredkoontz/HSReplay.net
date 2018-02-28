import * as _ from "lodash";
import React from "react";
import { VictoryArea, VictoryAxis, VictoryChart } from "victory";
import { getChartMetaData, toTimeSeries } from "../../helpers";
import { RenderData } from "../../interfaces";

interface Props {
	data?: RenderData;
	height: number;
	width: number;
}

export default class PopularityLineChart extends React.Component<Props> {
	private filterId = _.uniqueId("popularity-gradient-");

	public render(): React.ReactNode {
		const series = toTimeSeries(
			this.props.data.series.find(
				x => x.name === "popularity_over_time",
			) || this.props.data.series[0],
		);

		const metadata = getChartMetaData(series.data, undefined, true, 1);
		metadata.yDomain = [0, Math.max(10, metadata.yDomain[1])];

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
						scale="sqrt"
						tickValues={[0, 5, 20, 50, 100]}
						tickFormat={tick => ""}
						style={{
							axis: { visibility: "hidden" },
							grid: { stroke: "transparent" },
						}}
					/>
					<defs>
						<linearGradient
							id={this.filterId}
							x1="50%"
							y1="100%"
							x2="50%"
							y2="0%"
						>
							<stop
								stopColor="rgba(255, 255, 255, 0)"
								offset={0}
							/>
							<stop
								stopColor="rgba(0, 128, 255, 0.6)"
								offset={1}
							/>
						</linearGradient>
					</defs>
					<VictoryArea
						data={series.data.map(p => {
							return { x: p.x, y: p.y, _y0: metadata.yDomain[0] };
						})}
						interpolation="monotoneX"
						style={{
							data: {
								fill: `url(#${this.filterId})`,
								stroke: "black",
								strokeWidth: 1,
							},
						}}
					/>
				</VictoryChart>
			</div>
		);
	}
}
