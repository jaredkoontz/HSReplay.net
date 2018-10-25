import React from "react";
import { translate } from "react-i18next";
import { ResponsiveLine } from "@nivo/line";
import { getHeroSkinCardUrl, image } from "../../../helpers";
import { formatNumber, formatOrdinal, i18nFormatDate } from "../../../i18n";
import { setDayOfYear } from "date-fns";

export const enum Aggregation {
	BY_SEASON = "BY_SEASON",
	BY_DAY = "BY_DAY",
}

interface Props {
	data: any;
	caption?: string;
	summaryLabel?: string;
	summaryValue?: number;
	aggregate?: Aggregation;
	firstYear?: number;
}

const LABEL_BLUE = "#a8bcd5";
const LINE_GRAY = "#ced5df";

const AxisTheme = {
	axis: {
		domain: {
			line: {
				stroke: LINE_GRAY,
				strokeWidth: 1,
			},
		},
		ticks: {
			line: {
				stroke: "transparent",
				strokeWidth: 0,
			},
			text: {
				fill: LABEL_BLUE,
				fontWeight: "bold",
				fontSize: 13,
			},
		},
		legend: {
			text: {
				fill: "#f00",
				fontSize: 50,
			},
		},
	},
};

const MarkersTheme = {
	markers: {
		lineColor: LINE_GRAY,
		lineStrokeWidth: 1,
		textColor: LABEL_BLUE,
		fontSize: 13,
	},
};

class ProfileChart extends React.Component<Props> {
	public render(): React.ReactNode {
		const yBounds: number[] = [null, null];
		const xBounds: number[] = [null, null];
		const winrateSeries = this.props.data[0].data;
		let lastY: null | number = null;
		for (const { x, y } of winrateSeries) {
			if (xBounds[0] === null || x < xBounds[0]) {
				xBounds[0] = x;
			}
			if (xBounds[1] === null || x > xBounds[1]) {
				xBounds[1] = x;
			}
			if (y !== null) {
				if (yBounds[0] === null || y < yBounds[0]) {
					yBounds[0] = y;
				}
				if (yBounds[1] === null || y > yBounds[1]) {
					yBounds[1] = y;
				}
				lastY = y;
			}
		}

		// generate vertical markers at points of interest
		const markers = [];
		if (this.props.firstYear) {
			switch (this.props.aggregate) {
				case Aggregation.BY_SEASON:
					// markers for the different years
					for (let i = Math.floor(xBounds[0]); i < xBounds[1]; i++) {
						if (i % 12 === 0) {
							markers.push({
								axis: "x",
								value: i - 0.5, // "half a month" before the middle of January
								legend:
									this.props.firstYear + Math.floor(i / 12),
							});
						}
					}
					break;
				case Aggregation.BY_DAY:
					// markers for the different seasons
					for (let i = Math.floor(xBounds[0]); i < xBounds[1]; i++) {
						const currentYear =
							this.props.firstYear + Math.floor(i / 365);
						const date = setDayOfYear(
							new Date(currentYear, 6, 1),
							i,
						);
						const dayOfMonth = date.getDate();
						if (dayOfMonth === 1) {
							markers.push({
								axis: "x",
								value: i - 0.5, // "half a month" before the middle of January
								legend: i18nFormatDate(date, "MMM"),
							});
						}
					}
					break;
			}
		}

		const chart = (
			<ResponsiveLine
				data={this.props.data}
				lineWidth={1}
				curve="monotoneX"
				dotSize={6}
				enableDotLabel={false}
				dotBorderWidth={1}
				dotBorderColor="inherit:lighter(0.3)"
				enableGridX={false}
				colors={"rgb(74, 152, 72)"}
				xScale={{
					type: "linear",
					min: xBounds[0] - 0.5,
					max: xBounds[1] + 0.75,
				}}
				yScale={{
					type: "linear",
					stacked: false,
					min: Math.max(Math.floor(yBounds[0] - 5), 0),
					max: Math.min(Math.ceil(yBounds[1] + 5), 100) - 0.01,
				}}
				margin={{
					bottom: 50,
					left: 60,
					right: 0,
					top: 0,
				}}
				markers={markers}
				padding={{
					right: 50,
				}}
				axisLeft={{
					format: pct => `${pct}`,
					tickPadding: 8,
					theme: AxisTheme,
				}}
				axisBottom={{
					format:
						this.props.aggregate === Aggregation.BY_DAY
							? dayOfYear => {
									const year =
										this.props.firstYear +
										Math.floor(dayOfYear / 365);
									return formatOrdinal(
										setDayOfYear(
											new Date(year, 6, 1),
											dayOfYear,
										).getDate(),
									);
							  }
							: month =>
									i18nFormatDate(
										new Date().setUTCMonth(month),
										"MMM",
									) || "",
					tickPadding: 15,
					theme: AxisTheme,
				}}
				tooltipFormat={pct => `${formatNumber(pct, 1)}%`}
				areaOpacity={0.07}
				theme={MarkersTheme}
			/>
		);

		const { caption, summaryLabel, summaryValue } = this.props;

		let summary = null;
		const showSummary = summaryLabel || summaryValue;
		if (showSummary) {
			const summaryClassNames = ["profile-stats-chart-summary"];
			if (
				this.props.data.length === 1 &&
				this.props.summaryValue !== undefined
			) {
				if (lastY < this.props.summaryValue) {
					summaryClassNames.push(
						"profile-stats-chart-summary-negative",
					);
				} else if (lastY > this.props.summaryValue) {
					summaryClassNames.push(
						"profile-stats-chart-summary-positive",
					);
				}
			}

			summary = (
				<figcaption
					className={summaryClassNames.join(" ")}
					style={{
						backgroundImage: `linear-gradient(to bottom, rgba(238, 242, 246, 1) 0%, rgba(238, 242, 246, 0.7) 100%), url(${getHeroSkinCardUrl(
							"HUNTER",
						)})`,
						backgroundRepeat: "no-repeat",
						backgroundPosition: "bottom",
						backgroundSize: "cover",
					}}
				>
					<figure>
						<output>{formatNumber(summaryValue, 1)}</output>
						<figcaption>{summaryLabel}</figcaption>
					</figure>
				</figcaption>
			);
		}

		const body = summary ? (
			<figure>
				{summary}
				{chart}
			</figure>
		) : (
			chart
		);

		return (
			<figure className="profile-stats-chart">
				{caption ? <figcaption>{caption}</figcaption> : null}
				<div className="profile-stats-chart-body">{body}</div>
			</figure>
		);
	}
}

export default translate()(ProfileChart);
