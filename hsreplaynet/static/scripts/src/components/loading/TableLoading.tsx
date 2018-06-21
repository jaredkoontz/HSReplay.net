import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import CardData from "../../CardData";
import { cloneComponent } from "../../helpers";
import { LoadingStatus } from "../../interfaces";
import LoadingSpinner from "../LoadingSpinner";

interface Props extends InjectedTranslateProps {
	cardData?: CardData;
	customMessage?: string;
	dataKeys?: string[];
	status?: LoadingStatus;
}

class TableLoading extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t } = this.props;
		if (this.props.customMessage) {
			return (
				<h3 className="message-wrapper">{this.props.customMessage}</h3>
			);
		}

		switch (this.props.status) {
			case LoadingStatus.LOADING:
				return (
					<h3 className="message-wrapper">
						<LoadingSpinner active />
					</h3>
				);
			case LoadingStatus.PROCESSING:
				return (
					<div className="message-wrapper">
						<LoadingSpinner active />
						<p>
							<i>{t("This may take a few seconds")}</i>
						</p>
					</div>
				);
			case LoadingStatus.NO_DATA:
				return (
					<h3 className="message-wrapper">
						{t("No available data")}
					</h3>
				);
			case LoadingStatus.ERROR:
				return (
					<h3 className="message-wrapper">
						{t("Please check back later")}
					</h3>
				);
		}
		if (this.props.cardData === null) {
			return (
				<h3 className="message-wrapper">
					<LoadingSpinner active />
				</h3>
			);
		}

		const noData = (this.props.dataKeys || ["data"]).every(key => {
			const data = this.props[key].series.data;
			const keys = Object.keys(data);
			return keys.length === 0 || data[keys[0]].length === 0;
		});
		if (noData) {
			return (
				<h3 className="message-wrapper">{t("No available data")}</h3>
			);
		}
		return cloneComponent(this.props.children, this.props);
	}
}
export default translate()(TableLoading);
