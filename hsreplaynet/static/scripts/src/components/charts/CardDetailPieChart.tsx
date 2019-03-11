import React from "react";
import {
	VictoryContainer,
	VictoryLabel,
	VictoryLegend,
	VictoryPie,
} from "victory";
import { getChartScheme, pieScaleTransform } from "../../helpers";
import { ChartScheme, RenderData } from "../../interfaces";
import { WithTranslation, withTranslation } from "react-i18next";
import { formatNumber } from "../../i18n";

interface Props extends WithTranslation {
	data?: RenderData;
	title?: string;
	scheme?: ChartScheme;
	sortByValue?: boolean;
	removeEmpty?: boolean;
	groupSparseData?: boolean;
	percentage?: boolean;
	customViewbox?: string;
	formatLabel?: (label: string) => string;
}

class CardDetailPieChart extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t } = this.props;
		const series = this.props.data.series[0];
		let data = series.data;
		let fill = null;
		let stroke = null;
		let scheme = this.props.scheme;
		const legendData = [];

		if (!scheme && series.metadata && series.metadata["chart_scheme"]) {
			scheme = getChartScheme(
				series.metadata["chart_scheme"],
				this.props.t,
			);
		}

		if (scheme) {
			fill = prop => scheme[prop.xName.toLowerCase()].fill;
			stroke = prop => scheme[prop.xName.toLowerCase()].stroke;
			data = Object.keys(scheme).map(
				key =>
					data.find(
						d => ("" + d.x).toLowerCase() === key.toLowerCase(),
					) || { x: key, y: 0 },
			);
			if (this.props.removeEmpty) {
				data = data.filter(x => x.y > 0);
			}

			if (this.props.groupSparseData) {
				let remaining = 0;
				let filtered = 0;
				const filteredData = data.filter(a => {
					const value = +a.y;
					if (value <= 5) {
						remaining += value;
						filtered++;
						return false;
					}
					return true;
				});
				if (filtered > 0) {
					if (remaining > 0) {
						filteredData.push({
							x: "other",
							y: remaining,
						});
					}
					data = filteredData;
				}
			}
		}

		if (this.props.sortByValue) {
			data = data.sort((a, b) => {
				const o = [a.x, b.x].indexOf("other");
				if (o !== -1) {
					return -2 * o + 1;
				}
				return a.y > b.y ? -1 : 1;
			});
		}

		if (scheme) {
			data.forEach(d => {
				legendData.push({
					name:
						d.x === "other"
							? t("Other")
							: this.formatLabel("" + d.x),
					symbol: {
						type: "circle",
						fill: scheme[("" + d.x).toLowerCase()].stroke,
					},
				});
			});
		}

		return (
			<svg viewBox={this.props.customViewbox || "0 0 400 400"}>
				<VictoryPie
					standalone={false}
					containerComponent={<VictoryContainer title="" />}
					animate={{ duration: 300 }}
					labels={d => {
						if (d.x === "other" && this.props.percentage) {
							return "<" + formatNumber(d.y) + "%";
						}
						return this.props.percentage
							? formatNumber(d.y, 1) + "%"
							: d.y;
					}}
					height={400}
					width={400}
					padding={{ left: 150, right: 50 }}
					data={data}
					style={{
						data: {
							transition: "transform .2s ease-in-out",
							fill,
							stroke,
							strokeWidth: series.data.length > 1 ? 2 : 0,
						},
					}}
					events={[
						{
							target: "data",
							eventHandlers: {
								onMouseOver: () => {
									return [
										{
											mutation: props => ({
												style: Object.assign(
													{},
													props.style,
													{
														transform: pieScaleTransform(
															props,
															1.1,
														),
													},
												),
											}),
										},
									];
								},
								onMouseOut: () => {
									this.setState({ text: null });
									return [
										{
											mutation: props => ({
												style: Object.assign(
													{},
													props.style,
													{ transform: null },
												),
											}),
										},
									];
								},
							},
						},
					]}
				/>
				<VictoryLegend
					y={80}
					standalone={false}
					data={legendData}
					rowGutter={-7}
				/>
				{this.props.title ? (
					<VictoryLabel
						textAnchor="middle"
						verticalAnchor="middle"
						x={230}
						y={20}
						text={this.props.title}
						style={{
							fontSize: 20,
						}}
					/>
				) : null}
			</svg>
		);
	}

	private formatLabel(label: string) {
		if (this.props.formatLabel) {
			return this.props.formatLabel(label);
		}
		return label;
	}
}

export default withTranslation()(CardDetailPieChart);
