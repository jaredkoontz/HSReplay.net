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
				<>
					<p>
						<Trans>
							We were unable to report this issue automatically.
						</Trans>
					</p>
					{this.renderError()}
				</>
			);
		}
		return (
			<>
				<Trans
					defaults="<0>We've been notified about this issue and will be looking into it.</0><1>If you'd like to <0>contact us</0>, please pass along the following event reference:</1>"
					components={[
						<p>1</p>,
						<p>
							<a href="/contact/" target="_blank">
								0
							</a>
						</p>,
					]}
				/>
				<pre>{this.state.tracing}</pre>
			</>
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
			<>
				<Trans
					defaults="<0>If you keep seeing this message, please <0>contact us</0> with the following error:</0>"
					components={[
						<p>
							<a href="/contact/" target="_blank">
								0
							</a>,
						</p>,
					]}
				/>
				<pre>{message}</pre>
			</>
		);
	}
}
export default translate()(ErrorReporter);
