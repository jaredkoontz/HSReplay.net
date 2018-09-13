import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";

interface Props extends InjectedTranslateProps {
	active?: boolean;
	small?: boolean;
}

interface State {
	timedOut: boolean;
}

class LoadingSpinner extends React.Component<Props, State> {
	timeout: number | null = null;

	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			timedOut: false,
		};
	}

	componentDidMount() {
		if (this.props.active) {
			this.timeout = window.setTimeout(() => {
				this.setState({ timedOut: true });
			}, 30000);
		}
	}

	componentWillUnmount() {
		if (this.timeout !== null) {
			window.clearTimeout(this.timeout);
		}
	}

	componentDidUpdate(prevProps: Props) {
		if (prevProps.active !== this.props.active) {
			this.setState({ timedOut: false });
			if (this.timeout !== null) {
				window.clearTimeout(this.timeout);
				this.timeout = null;
			}
			if (this.props.active) {
				this.timeout = window.setTimeout(() => {
					this.setState({ timedOut: true });
				}, 30000);
			}
		}
	}

	public render(): React.ReactNode {
		const { active, t } = this.props;

		if (!active) {
			return null;
		}

		if (this.state.timedOut) {
			return (
				<h3 className="message-wrapper">
					{t("Please check back later")}
				</h3>
			);
		}

		const className = ["loading-spinner"];
		if (this.props.small) {
			className.push("small");
		}

		return (
			<div className={className.join(" ")}>
				{Array.apply(null, { length: 12 }).map((x, i) => (
					<div key={i} />
				))}
			</div>
		);
	}
}

export default translate()(LoadingSpinner);
