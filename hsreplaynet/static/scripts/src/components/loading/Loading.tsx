import React from "react";
import { LoadingStatus } from "../../interfaces";
import * as _ from "lodash";

type StringOrJSX = string | JSX.Element | JSX.Element[];

interface Props {
	customNoDataMessage?: StringOrJSX;
	status?: LoadingStatus;
}

export const withLoading = (dataKeys?: string[]) => <T extends {}>(
	// tslint:disable-next-line:variable-name
	Component: React.ComponentClass<T>
) => {
	return class Loading extends React.Component<T & Props> {
		public render(): React.ReactNode {
			const { customNoDataMessage, status } = this.props;
			if (status !== undefined) {
				const message = getLoadingMessage(status, customNoDataMessage);
				if (typeof message === "string") {
					return (
						<h3 className="message-wrapper" aria-busy="true">
							{message}
						</h3>
					);
				} else if (message !== null) {
					return (
						<div className="message-wrapper" aria-busy="true">
							{message}
						</div>
					);
				}
			}
			const noData = (dataKeys || ["data"]).some(key => {
				const data = this.props[key];
				return !data || (Array.isArray(data) && data.length === 0);
			});
			if (noData) {
				const message = getLoadingMessage(
					LoadingStatus.NO_DATA,
					customNoDataMessage
				);
				if (typeof message === "string") {
					return <h3 className="message-wrapper">{message}</h3>;
				} else if (message !== null) {
					return <div className="message-wrapper">{message}</div>;
				}
			}
			const props = _.omit(
				this.props,
				"status",
				"customNoDataMessage"
			) as T;
			return <Component {...props} />;
		}
	};
};

function getLoadingMessage(
	status: LoadingStatus,
	customNoDataMessage?: StringOrJSX
): StringOrJSX | null {
	switch (status) {
		case LoadingStatus.SUCCESS:
			return null;
		case LoadingStatus.LOADING:
			return "Loading…";
		case LoadingStatus.PROCESSING:
			return [
				<h3>Loading…</h3>,
				<p>
					<i>This may take a few seconds</i>
				</p>
			];
		case LoadingStatus.NO_DATA:
			return customNoDataMessage || "No available data";
		case LoadingStatus.ERROR:
			return "Please check back later";
	}
}
