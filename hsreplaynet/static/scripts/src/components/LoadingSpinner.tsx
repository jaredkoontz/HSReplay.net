import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";

interface Props extends WithTranslation {
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

		const dots = [];
		for (let i = 0; i < 12; i++) {
			dots.push(<div key={i} />);
		}

		return <div className={className.join(" ")}>{dots}</div>;
	}
}

export default withTranslation()(LoadingSpinner);
