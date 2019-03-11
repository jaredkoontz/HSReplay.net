import _ from "lodash";
import React from "react";
import { Translation } from "react-i18next";
import i18next from "i18next";
import { LoadingStatus } from "../../interfaces";
import LoadingSpinner from "../LoadingSpinner";

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

interface Props {
	customNoDataMessage?: React.ReactNode;
	status?: LoadingStatus;
}

export const withLoading = (dataKeys?: string[], className?: string) => <
	T extends {}
>(
	// tslint:disable-next-line:variable-name
	Component: React.ComponentType<T>,
): React.ComponentType<T & Props> => {
	type InnerProps = T & Props;

	const cls = class Loading extends React.Component<InnerProps> {
		static displayName = "withLoading";

		private getClassName(): string {
			return "message-wrapper" + (className ? " " + className : "");
		}

		private getLoadingMessage(
			status: LoadingStatus,
			customNoDataMessage: React.ReactNode,
			t: i18next.TFunction,
		): React.ReactNode {
			switch (status) {
				case LoadingStatus.SUCCESS:
					return null;
				case LoadingStatus.LOADING:
					return <LoadingSpinner active />;
				case LoadingStatus.PROCESSING:
					return (
						<>
							<LoadingSpinner active />
							<p>
								<i>{t("This may take a few seconds")}</i>
							</p>
						</>
					);
				case LoadingStatus.NO_DATA:
					return customNoDataMessage || t("No available data");
				case LoadingStatus.ERROR:
					return t("Could not load data. Please check back later.");
			}
		}

		public render(): React.ReactNode {
			return (
				<Translation>
					{t => {
						const { customNoDataMessage, status } = this.props;
						if (status !== undefined) {
							const message = this.getLoadingMessage(
								status,
								customNoDataMessage,
								t,
							);
							if (typeof message === "string") {
								return (
									<h3
										className={this.getClassName()}
										aria-busy="true"
									>
										{message}
									</h3>
								);
							} else if (message !== null) {
								return (
									<div
										className={this.getClassName()}
										aria-busy="true"
									>
										{message}
									</div>
								);
							}
						}
						const noData = (dataKeys || ["data"]).some(key => {
							const data = this.props[key];
							return (
								!data ||
								(Array.isArray(data) && data.length === 0)
							);
						});
						if (noData) {
							const message = this.getLoadingMessage(
								LoadingStatus.NO_DATA,
								customNoDataMessage,
								t,
							);
							if (typeof message === "string") {
								return (
									<h3 className={this.getClassName()}>
										{message}
									</h3>
								);
							} else if (message !== null) {
								return (
									<div className={this.getClassName()}>
										{message}
									</div>
								);
							}
						}
						const props = _.omit(
							this.props,
							"status",
							"customNoDataMessage",
						) as T;
						return <Component {...props} />;
					}}
				</Translation>
			);
		}
	};

	return cls;
};
