import React from "react";
import { InjectedTranslateProps, Trans, translate } from "react-i18next";
import { AutoSizer } from "react-virtualized";
import { toDynamicFixed } from "../../helpers";
import { LoadingStatus } from "../../interfaces";
import PrettyCardClass from "../text/PrettyCardClass";
import PopularityLineChart from "./PopularityLineChart";

interface Props extends InjectedTranslateProps {
	chartData?: any;
	href: string;
	onClick?: () => void;
	playerClass: string;
	popularity?: number;
	status?: LoadingStatus;
}

class PopularityBox extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t } = this.props;
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
			const popularity = `${toDynamicFixed(this.props.popularity, 2)}%`;
			content = (
				<Trans
					defaults="<0>{popularity}</0> of <2></2> decks"
					components={[
						<h1 key={0}>0</h1>,
						<h3 key={1}>1</h3>,
						<PrettyCardClass
							cardClass={this.props.playerClass}
							key={2}
						>
							2
						</PrettyCardClass>,
					]}
					tOptions={{ popularity }}
				/>
			);
		} else if (
			this.props.status === LoadingStatus.NO_DATA ||
			this.props.status === LoadingStatus.PROCESSING
		) {
			content = t("Please check back later");
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
					<div className="box-title">{t("Popularity")}</div>
					<div className="box-content">{content}</div>
					<div className="box-chart">{chart}</div>
				</a>
			</div>
		);
	}
}

export default translate()(PopularityBox);
