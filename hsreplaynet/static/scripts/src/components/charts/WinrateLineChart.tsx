import { addDays } from "date-fns";
import _ from "lodash";
import React from "react";
import {
	VictoryArea,
	VictoryAxis,
	VictoryChart,
	VictoryClipContainer,
	VictoryLabel,
	VictoryVoronoiContainer,
} from "victory";
import {
	getChartMetaData,
	sliceZeros,
	toDynamicFixed,
	toTimeSeries,
} from "../../helpers";
import { i18nFormatDate } from "../../i18n";
import { RenderData } from "../../interfaces";
import ChartHighlighter from "./ChartHighlighter";
import WinLossGradient from "./gradients/WinLossGradient";
import { WithTranslation, withTranslation } from "react-i18next";

interface Props extends WithTranslation {
	data?: RenderData;
	title?: string;
	widthRatio?: number;
	width?: number;
	height?: number;
	absolute?: boolean;
	axisLabelY?: string;
}

class WinrateLineChart extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t } = this.props;
		const height = this.props.height || 150;
		const width =
			Math.max(0, this.props.width) ||
			height * (this.props.widthRatio || 3);
		const series = toTimeSeries(
			this.props.data.series.find(x => x.name === "winrates_over_time") ||
				this.props.data.series[0],
		);

		// This is a temporary solution to remove very low volume data points from the Un'Goro launch
		if (series.data[0].x === new Date("2017-04-05").getTime()) {
			const popularity = toTimeSeries(
				this.props.data.series.find(
					x => x.name === "popularity_over_time",
				) || this.props.data.series[0],
			);
			if (
				popularity.data[0].x === new Date("2017-04-05").getTime() &&
				+popularity.data[0].y * 100 < +popularity.data[1].y
			) {
				series.data.shift();
			}
		}

		const metadata = getChartMetaData(series.data, 50, true, 10);

		const minAbove50 = metadata.yMinMax[0].y > 50;
		const maxBelow50 = metadata.yMinMax[1].y < 50;
		const isMinTick = (tick: number) => tick === metadata.yDomain[0];
		const isMaxTick = (tick: number) => tick === metadata.yDomain[1];

		const yTicks = [50];
		metadata.yDomain.forEach(
			value => yTicks.indexOf(value) === -1 && yTicks.push(value),
		);

		const filterId = _.uniqueId("winrate-by-time-gradient-");

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
					padding={padding}
					domain={{ x: metadata.xDomain, y: metadata.yDomain }}
					containerComponent={
						<VictoryVoronoiContainer voronoiDimension="x" />
					}
				>
					<VictoryAxis
						scale="time"
						tickValues={metadata.seasonTicks}
						tickFormat={tick =>
							i18nFormatDate(addDays(tick, 1), "MMMM")
						}
						style={{
							axisLabel: { fontSize },
							tickLabels: { fontSize },
							grid: { stroke: "gray" },
							axis: { visibility: "hidden" },
						}}
					/>
					<VictoryAxis
						dependentAxis
						label={this.props.axisLabelY || t("Winrate")}
						axisLabelComponent={
							<VictoryLabel
								textAnchor="middle"
								verticalAnchor="middle"
								x={fontSize / 2 * factor}
								y={yCenter}
							/>
						}
						tickValues={[50].concat(metadata.yDomain)}
						tickFormat={tick => {
							if (tick === 50) {
								return "50%";
							}
							if (minAbove50 && isMinTick(tick)) {
								return "";
							}
							if (maxBelow50 && isMaxTick(tick)) {
								return "";
							}
							return metadata.toFixed(tick) + "%";
						}}
						style={{
							axisLabel: { fontSize },
							tickLabels: { fontSize },
							grid: {
								stroke: tick =>
									tick === 50
										? "gray"
										: (minAbove50 && isMinTick(tick)) ||
										  (maxBelow50 && isMaxTick(tick))
											? "transparent"
											: "lightgray",
							},
							axis: { visibility: "hidden" },
						}}
					/>
					<defs>
						<WinLossGradient id={filterId} metadata={metadata} />
					</defs>
					<VictoryArea
						data={series.data.map(p => ({
							x: p.x,
							y: p.y,
							_y0: 50,
						}))}
						groupComponent={
							<VictoryClipContainer clipPadding={5} />
						}
						interpolation="monotoneX"
						labelComponent={
							<ChartHighlighter
								xCenter={metadata.xCenter}
								sizeFactor={factor}
							/>
						}
						labels={d =>
							i18nFormatDate(d.x, "YYYY-MM-DD") +
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

export default withTranslation()(WinrateLineChart);
