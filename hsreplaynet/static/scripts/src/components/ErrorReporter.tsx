import React from "react";
import { InjectedTranslateProps, Trans, translate } from "react-i18next";
import RavenWatcher from "../RavenWatcher";

interface Props extends InjectedTranslateProps {}

interface State {
	error: Error | null;
	errorInfo: React.ErrorInfo | null;
	tracing: any | null;
}

class ErrorReporter extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			error: null,
			errorInfo: null,
			tracing: null,
		};
	}

	public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
		if (this.state.error !== null) {
			return;
		}
		const report = { error, errorInfo, tracing: null };
		if (typeof Raven === "object") {
			const watcher = new RavenWatcher();
			watcher.start();
			Raven.captureException(error, { extra: errorInfo });
			watcher.stop();
			if (!watcher.failure) {
				report.tracing = Raven.lastEventId();
			}
		}
		this.setState(report);
	}

	public render(): React.ReactNode {
		const { t } = this.props;
		if (!this.state.error) {
			return this.props.children;
		}
		return (
			<div className="error-reporter">
				<div className="container">
					<h1>{t("Something went wrong!")}</h1>
					{this.renderMessage()}
				</div>
			</div>
		);
	}

	renderMessage() {
		if (!this.state.tracing) {
			return (
				<Trans>
					<p>We were unable to report this issue automatically.</p>
					{this.renderError()}
				</Trans>
			);
		}
		return (
			<Trans>
				<p>
					We've been notified about this issue and will be looking
					into it.
				</p>
				<p>
					If you'd like to{" "}
					<a href="/contact/" target="_blank">
						contact us
					</a>, please pass along the following event reference:
				</p>
				<pre>{this.state.tracing}</pre>
			</Trans>
		);
	}

	renderError() {
		if (!this.state.error) {
			return null;
		}
		let message = this.state.error.message;
		if (this.state.errorInfo && this.state.errorInfo.componentStack) {
			message += this.state.errorInfo.componentStack;
		}
		return (
			<Trans>
				<p>
					If you keep seeing this message, please{" "}
					<a href="/contact/" target="_blank">
						contact us
					</a>{" "}
					with the following error:
				</p>
				<pre>{message}</pre>
			</Trans>
		);
	}
}
export default translate()(ErrorReporter);
