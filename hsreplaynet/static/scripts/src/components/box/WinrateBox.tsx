import React from "react";
import { AutoSizer } from "react-virtualized";
import WinrateLineChart from "./WinrateLineChart";
import { commaSeparate, toDynamicFixed, winrateData } from "../../helpers";
import { LoadingStatus } from "../../interfaces";

interface Props {
	chartData?: any;
	games?: number;
	href: string;
	onClick?: () => void;
	winrate?: number;
	status?: LoadingStatus;
}

export default class WinrateBox extends React.Component<Props> {
	public render(): React.ReactNode {
		let chart = null;
		if (this.props.chartData) {
			chart = (
				<AutoSizer disableHeight>
					{({ width }) => (
						<WinrateLineChart
							data={this.props.chartData}
							height={50}
							width={width}
						/>
					)}
				</AutoSizer>
			);
		}

		let content = null;
		if (
			this.props.winrate !== undefined &&
			this.props.games !== undefined
		) {
			const wrData = winrateData(50, this.props.winrate, 3);
			content = [
				<h1 style={{ color: wrData.color }}>
					{toDynamicFixed(this.props.winrate, 2)}%
				</h1>,
				<h3>over {commaSeparate(this.props.games)} games</h3>
			];
		} else if (
			this.props.status === LoadingStatus.NO_DATA ||
			this.props.status === LoadingStatus.PROCESSING
		) {
			content = "Please check back later";
		}

		return (
			<div className="col-xs-12 col-sm-6 col-md-4 col-lg-4">
				<a
					className="box winrate-box"
					href={this.props.href}
					onClick={event => {
						if (this.props.onClick) {
							event.preventDefault();
							this.props.onClick();
						}
					}}
				>
					<div className="box-title">Winrate</div>
					<div className="box-content">{content}</div>
					<div className="box-chart">{chart}</div>
				</a>
			</div>
		);
	}
}
