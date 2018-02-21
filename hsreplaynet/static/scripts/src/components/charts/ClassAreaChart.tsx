import * as moment from "moment";
import React from "react";
import {
	VictoryArea,
	VictoryAxis,
	VictoryChart,
	VictoryLabel,
	VictoryStack
} from "victory";
import { getChartScheme } from "../../helpers";
import { RenderData } from "../../interfaces";

interface Props {
	data?: RenderData;
	widthRatio?: number;
}

export default class ClassAreaChartChart extends React.Component<Props> {
	public render(): React.ReactNode {
		const width = 150 * (this.props.widthRatio || 3);

		// semi mock data
		const seasonTicks = [
			new Date("2017-01-31T20:00:00").getTime(),
			new Date("2017-02-28T20:00:00").getTime()
		];
		const areas = [];

		const classes = [
			"WARRIOR",
			"SHAMAN",
			"ROGUE",
			"PALADIN",
			"HUNTER",
			"DRUID",
			"WARLOCK",
			"MAGE",
			"PRIEST"
		];
		const dates = [
			"2017-01-30T00:00:00",
			"2017-02-06T00:00:00",
			"2017-02-13T00:00:00",
			"2017-02-20T00:00:00",
			"2017-02-27T00:00:00",
			"2017-03-06T00:00:00"
		];

		classes.sort();

		const scheme = getChartScheme("class");
		classes.forEach(playerClass => {
			const seriesData = this.props.data.series.find(
				x => x.name === playerClass
			);
			const series = { name: playerClass, data: [] };
			dates.forEach(date => {
				const point =
					seriesData &&
					seriesData.data.find(x => x.game_date === date);
				series.data.push({
					x: new Date(date).getTime(),
					y: point ? point.num_games : 0
				});
			});
			const classColor = scheme[playerClass.toLowerCase()];
			areas.push(
				<VictoryArea
					data={series.data}
					style={{
						data: {
							fill: classColor.fill.replace("0.7", "0.6"),
							stroke: "rgba(0, 0, 0, 0.1)",
							strokeWidth: 0.5
						}
					}}
					interpolation="linear"
				/>
			);
		});

		return (
			<svg viewBox={"0 0 " + width + " 150"}>
				<VictoryChart
					height={150}
					width={width}
					domainPadding={{ x: 0, y: 10 }}
					padding={{ left: 40, top: 30, right: 20, bottom: 30 }}
				>
					<VictoryAxis
						scale="time"
						tickValues={seasonTicks}
						tickFormat={tick =>
							moment(tick)
								.add(1, "day")
								.format("MMMM")
						}
						style={{
							axisLabel: { fontSize: 8 },
							tickLabels: { fontSize: 8 },
							grid: { stroke: "gray" },
							axis: { visibility: "hidden" }
						}}
					/>
					<VictoryAxis
						dependentAxis
						axisLabelComponent={<VictoryLabel dx={10} />}
						style={{
							axisLabel: { fontSize: 8 },
							tickLabels: { fontSize: 8 },
							grid: {
								stroke: d => (d === 1000 ? "gray" : "lightgray")
							},
							axis: { visibility: "hidden" }
						}}
					/>
					<VictoryStack>{areas}</VictoryStack>
				</VictoryChart>
				<VictoryLabel
					text={"Games played - by week"}
					style={{ fontSize: 10 }}
					textAnchor="start"
					verticalAnchor="start"
					x={0}
					y={10}
				/>
			</svg>
		);
	}
}
