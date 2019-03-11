import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import CardData from "../../CardData";
import { cloneComponent } from "../../helpers";
import { LoadingStatus, RenderData } from "../../interfaces";
import LoadingSpinner from "../LoadingSpinner";

interface Props extends WithTranslation {
	cardData?: CardData;
	data?: RenderData;
	dataKeys?: string[];
	noDataCondition?: (data: RenderData) => boolean;
	status?: LoadingStatus;
	widthRatio?: number;
}

class ChartLoading extends React.Component<Props> {
	public render(): React.ReactNode {
		const width = 150 * (this.props.widthRatio || 2);
		const loadingMessage = this.getLoadingMessage();
		if (loadingMessage) {
			return (
				<div className="chart-wrapper">
					<svg viewBox={"0 0 " + width + " 150"} />
					{loadingMessage}
				</div>
			);
		}
		return cloneComponent(this.props.children, this.props);
	}

	getLoadingMessage(): React.ReactNode {
		const { t } = this.props;
		switch (this.props.status) {
			case LoadingStatus.LOADING:
				return (
					<h3 className="chart-message-wrapper" aria-busy="true">
						<LoadingSpinner active />
					</h3>
				);
			case LoadingStatus.PROCESSING:
				return (
					<div className="chart-message-wrapper" aria-busy="true">
						<LoadingSpinner active />
						<p>
							<i>{t("This may take a few seconds")}</i>
						</p>
					</div>
				);
			case LoadingStatus.NO_DATA:
				return (
					<h3 className="chart-message-wrapper">
						{t("No available data.")}
					</h3>
				);
			case LoadingStatus.ERROR:
				return (
					<h3 className="chart-message-wrapper">
						{t("Something went wrong!")}
					</h3>
				);
		}
		if (this.props.cardData === null) {
			return (
				<h3 className="chart-message-wrapper" aria-busy="true">
					<LoadingSpinner active />
				</h3>
			);
		}

		const noDataCondition =
			this.props.noDataCondition ||
			(data => data.series[0].data.length < 2);
		const noData = (this.props.dataKeys || ["data"]).every(key => {
			return (
				this.props[key].series.length === 0 ||
				noDataCondition(this.props[key])
			);
		});
		if (noData) {
			return (
				<h3 className="chart-message-wrapper">
					{t("No available data.")}
				</h3>
			);
		}
		return null;
	}
}

export default withTranslation()(ChartLoading);
