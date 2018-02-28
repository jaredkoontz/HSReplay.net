import React from "react";
import { AutoSizer } from "react-virtualized";
import { toDynamicFixed, toTitleCase } from "../../helpers";
import PopularityLineChart from "./PopularityLineChart";
import { LoadingStatus } from "../../interfaces";

interface Props {
	chartData?: any;
	href: string;
	onClick?: () => void;
	playerClass: string;
	popularity?: number;
	status?: LoadingStatus;
}

export default class PopularityBox extends React.Component<Props> {
	public render(): React.ReactNode {
		let chart = null;
		if (this.props.chartData) {
			chart = (
				<AutoSizer disableHeight>
					{({ width }) => (
						<PopularityLineChart
							data={this.props.chartData}
							height={50}
							width={width}
						/>
					)}
				</AutoSizer>
			);
		}

		let content = null;
		if (this.props.popularity !== undefined) {
			content = [
				<h1>{toDynamicFixed(this.props.popularity, 2)}%</h1>,
				<h3>of {toTitleCase(this.props.playerClass)} decks</h3>,
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
					className="box popularity-box"
					href={this.props.href}
					onClick={event => {
						if (this.props.onClick) {
							event.preventDefault();
							this.props.onClick();
						}
					}}
				>
					<div className="box-title">Popularity</div>
					<div className="box-content">{content}</div>
					<div className="box-chart">{chart}</div>
				</a>
			</div>
		);
	}
}
