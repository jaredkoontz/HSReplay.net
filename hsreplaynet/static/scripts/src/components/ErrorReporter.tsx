import React from "react";

interface Props {}

interface State {
	error: Error | null;
	errorInfo: React.ErrorInfo | null;
	tracing: any | null;
}

export default class ErrorReporter extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			error: null,
			errorInfo: null,
			tracing: null,
		};
	}

	public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
		const report = { error, errorInfo };
		if (typeof Raven === "object") {
			Raven.captureException(error, { extra: errorInfo });
			Object.assign(report, { tracing: Raven.lastEventId() });
		}
		this.setState(report);
	}

	public render(): React.ReactNode {
		if (!this.state.error) {
			return this.props.children;
		}
		return (
			<div className="error-reporter">
				<div className="container">
					<h1>Something went wrong!</h1>
					{this.renderMessage()}
				</div>
			</div>
		);
	}

	renderMessage() {
		if (!this.state.tracing) {
			return (
				<>
					<p>We were unable to report this issue automatically.</p>
					<p>
						Try disabling your adblocker or any similar browser
						extensions and reload the page.
					</p>
					{this.renderError()}
				</>
			);
		}
		return (
			<>
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
				<p>
					If you keep seeing this message, please{" "}
					<a href="/contact/" target="_blank">
						contact us
					</a>{" "}
					with the following error:
				</p>
				<pre>{message}</pre>
			</>
		);
	}
}
