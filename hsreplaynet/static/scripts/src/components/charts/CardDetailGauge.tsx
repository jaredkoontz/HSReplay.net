import React from "react";
import { VictoryContainer, VictoryLabel, VictoryPie } from "victory";
import { ChartSchemeData, RenderData } from "../../interfaces";

interface Props {
	renderData: RenderData;
	title?: string;
	speedometer?: boolean;
	scheme?: ChartSchemeData;
	maxValue?: number;
	reverse?: boolean;
}

export default class CardDetailGauge extends React.Component<Props> {
	private readonly speedometerAngle = 90;

	public render(): React.ReactNode {
		const maxValue = this.props.maxValue || 100;
		const percentBased = maxValue === 100;
		const offsetY = this.props.speedometer ? -75 : 0;
		const textY = this.props.speedometer ? 250 : 400;

		const series = this.props.renderData.series[0];
		const hasData = series && series.data[0] && series.data[0].y;
		const value = hasData ? +series.data[0].y : maxValue / 2;

		const data = [
			{ x: "data", y: this.props.reverse ? maxValue - value : value }
		];
		const remaining = maxValue - data[0].y;
		data.push({ x: "empty", y: remaining });

		const valueText = hasData
			? (this.props.reverse ? maxValue - data[0].y : data[0].y) +
				(percentBased ? "%" : "")
			: "";
		const color = this.props.scheme
			? this.props.scheme.stroke
			: "rgba(0, 0, 127, 0.9)";
		const emptyColor = this.props.scheme
			? this.props.scheme.fill
			: "rgba(0, 0, 127, 0.5)";

		return (
			<svg viewBox={"0 " + offsetY + " 400 450"}>
				<VictoryPie
					containerComponent={
						<VictoryContainer title={this.props.title} />
					}
					animate={{ duration: 300 }}
					height={400}
					width={400}
					data={data as any}
					innerRadius={70}
					startAngle={
						this.props.speedometer && -this.speedometerAngle
					}
					endAngle={this.props.speedometer && this.speedometerAngle}
					style={{
						data: {
							fill: d =>
								d.xName === "empty" ? emptyColor : color
						}
					}}
					labels={[]}
				/>,
				<VictoryLabel
					textAnchor="middle"
					verticalAnchor="middle"
					x={200}
					y={200}
					text={valueText}
					style={{ fontSize: 40 }}
				/>
				<VictoryLabel
					textAnchor="middle"
					verticalAnchor="middle"
					x={200}
					y={textY}
					text={this.props.title}
					style={{ fontSize: 40 }}
				/>
			</svg>
		);
	}
}
