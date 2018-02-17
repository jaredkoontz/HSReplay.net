import React from "react";

interface Props extends React.ClassAttributes<ErrorReporter> {}

interface State {
	error: Error | null;
	tracing: any | null;
}

export default class ErrorReporter extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			error: null,
			tracing: null
		};
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
		const report = { error };
		if (typeof Raven === "object") {
			Raven.captureException(error, { extra: errorInfo });
			Object.assign(report, { tracing: Raven.lastEventId() });
		}
		this.setState(report);
	}

	render() {
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
		const message = this.state.error.message;
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
