import React from "react";
import {
	VictoryAxis,
	VictoryBar,
	VictoryChart,
	VictoryContainer,
	VictoryLabel,
	VictoryStack,
	VictoryTooltip
} from "victory";
import { RenderData } from "../../interfaces";
import { getHeroColor } from "../../helpers";
import ClassFilter, { FilterOption } from "../ClassFilter";

interface Props {
	data: RenderData;
}

export default class ClassStackedBarChart extends React.Component<Props> {
	public render(): React.ReactNode {
		const bars = [];
		const xValues = [];

		const series = this.props.data.series;
		this.props.data.series.forEach(series => {
			series.data.forEach(d => {
				if (xValues.indexOf(d.game_date) === -1) {
					xValues.push(d.game_date);
				}
			});
			const color = getHeroColor(series.name);
			const tooltip = (
				<VictoryTooltip
					dy={-4}
					cornerRadius={0}
					pointerLength={5}
					padding={1}
					flyoutStyle={{
						stroke: color,
						fill: "rgba(255, 255, 255, 0.85)"
					}}
				/>
			);
			bars.unshift(
				<VictoryBar
					x={"game_date"}
					y={"num_games"}
					data={series.data}
					style={{
						data: {
							fill: color,
							width: Math.min(40, 200 / series.data.length)
						},
						labels: { fontSize: 6, padding: 5 }
					}}
					labelComponent={tooltip}
					labels={x =>
						x.game_date + "\n" + series.name + ": " + x.num_games
					}
				/>
			);
		});

		xValues.sort();

		return (
			<div className="chart stacked-bar-chart">
				<VictoryChart
					height={200}
					domainPadding={30}
					padding={{ left: 50, right: 20, bottom: 70, top: 20 }}
					containerComponent={<VictoryContainer title="" />}
				>
					<VictoryAxis
						tickValues={xValues}
						tickLabelComponent={
							<VictoryLabel
								angle={270}
								dx={5}
								dy={-0.6}
								textAnchor="end"
							/>
						}
						style={{ tickLabels: { fontSize: 6 } }}
					/>
					<VictoryAxis
						dependentAxis
						style={{
							tickLabels: { fontSize: 6 },
							grid: { stroke: "gray" }
						}}
					/>
					<VictoryStack>{bars}</VictoryStack>
				</VictoryChart>
			</div>
		);
	}
}
