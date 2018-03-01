import * as _ from "lodash";
import { addDays, format } from "date-fns";
import React from "react";
import { VictoryArea, VictoryAxis, VictoryChart, VictoryLabel } from "victory";
import { VictoryClipContainer, VictoryVoronoiContainer } from "victory";
import {
	getChartMetaData,
	sliceZeros,
	toDynamicFixed,
	toTimeSeries,
} from "../../helpers";
import { RenderData } from "../../interfaces";
import ChartHighlighter from "./ChartHighlighter";

interface PopularityLineChartProps {
	data?: RenderData;
	maxYDomain: 10 | 100;
	widthRatio?: number;
	width?: number;
	height?: number;
	absolute?: boolean;
	scale?: string;
}

export default class PopularityLineChart extends React.Component<
	PopularityLineChartProps
> {
	static defaultProps = {
		scale: "sqrt",
	};

	private readonly colorMin = "rgba(0, 196, 255, 1.0)";
	private readonly colorMax = "rgba(255, 128, 0, 1.0)";

	public render(): React.ReactNode {
		const height = this.props.height || 150;
		const width =
			Math.max(0, this.props.width) ||
			height * (this.props.widthRatio || 3);

		const series = toTimeSeries(
			this.props.data.series.find(
				x => x.name === "popularity_over_time",
			) || this.props.data.series[0],
		);

		// This is a temporary solution to remove very low volume data points from the Un'Goro launch
		if (
			series.data[0].x === new Date("2017-04-05").getTime() &&
			+series.data[0].y * 100 < +series.data[1].y
		) {
			series.data.shift();
		}

		const metadata = getChartMetaData(series.data, undefined, true, 1);
		metadata.yDomain = [
			0,
			Math.max(this.props.maxYDomain, metadata.yDomain[1]),
		];

		const filterId = _.uniqueId("popularity-gradient-");

		const factor = height / 150;
		const fontSize = factor * 8;
		const padding = {
			left: 40 * factor,
			top: 10 * factor,
			right: 20 * factor,
			bottom: 30 * factor,
		};
		const yCenter = height / 2 - (padding.bottom - padding.top) / 2;

		return (
			<div
				style={
					this.props.absolute && {
						position: "absolute",
						width: "100%",
						height: "100%",
					}
				}
			>
				<VictoryChart
					height={height}
					width={width}
					domainPadding={{ x: 0, y: 10 * factor }}
					domain={{ x: metadata.xDomain, y: metadata.yDomain }}
					padding={padding}
					containerComponent={
						<VictoryVoronoiContainer voronoiDimension="x" />
					}
				>
					<VictoryAxis
						scale="time"
						tickValues={metadata.seasonTicks}
						tickFormat={tick => format(addDays(tick, 1), "MMMM")}
						style={{
							axisLabel: { fontSize },
							tickLabels: { fontSize },
							grid: { stroke: "gray" },
							axis: { visibility: "hidden" },
						}}
					/>
					<VictoryAxis
						dependentAxis
						scale={this.props.scale as any}
						label={"Popularity"}
						axisLabelComponent={
							<VictoryLabel
								textAnchor="middle"
								verticalAnchor="middle"
								x={fontSize / 2 * factor}
								y={yCenter}
							/>
						}
						tickValues={
							this.props.maxYDomain === 10
								? [0, 0.5, 2, 5, 10]
								: [0, 5, 20, 50, 100]
						}
						tickFormat={tick => metadata.toFixed(tick) + "%"}
						style={{
							axisLabel: { fontSize },
							tickLabels: { fontSize },
							grid: {
								stroke: d =>
									d === metadata.yCenter
										? "gray"
										: "lightgray",
							},
							axis: { visibility: "hidden" },
						}}
					/>
					<defs>
						<linearGradient
							id={filterId}
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
						data={series.data.map(p => ({
							x: p.x,
							y: p.y,
							_y0: metadata.yDomain[0],
						}))}
						groupComponent={
							<VictoryClipContainer clipPadding={5} />
						}
						scale={this.props.scale as any}
						interpolation="monotoneX"
						labelComponent={
							<ChartHighlighter
								xCenter={metadata.xCenter}
								sizeFactor={factor}
							/>
						}
						labels={d =>
							format(d.x, "YYYY-MM-DD") +
							": " +
							sliceZeros(toDynamicFixed(d.y, 2)) +
							"%"
						}
						style={{
							data: {
								fill: `url(#${filterId})`,
								stroke: "black",
								strokeWidth: 0.3 * factor,
							},
						}}
					/>
				</VictoryChart>
			</div>
		);
	}
}
