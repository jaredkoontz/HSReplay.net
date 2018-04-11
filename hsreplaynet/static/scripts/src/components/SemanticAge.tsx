import React from "react";
import { distanceInWordsStrict, distanceInWordsToNow } from "date-fns";

interface Props {
	date?: Date | string;
	noSuffix?: boolean;
	strict?: boolean;
}

interface State {
	counter: number;
}

export default class SemanticAge extends React.Component<Props, State> {
	private interval: number;

	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			counter: 0,
		};
	}

	public componentDidMount(): void {
		this.interval = window.setInterval(() => {
			// update state to refresh the timestamp
			this.setState(state => ({
				counter: state.counter + 1 % 100,
			}));
		}, 5000);
	}

	public componentWillUnmount(): void {
		window.clearInterval(this.interval);
	}

	public render(): React.ReactNode {
		let { date } = this.props;
		const { noSuffix, strict } = this.props;

		if (!date) {
			return null;
		}

		if (typeof date === "string") {
			date = new Date(date);
		}

		const machineReadable = date.toISOString();
		const dateOpts = {
			addSuffix: !noSuffix,
		};
		const phrasing = strict
			? distanceInWordsStrict(new Date(), date, dateOpts)
			: distanceInWordsToNow(date, dateOpts);

		return <time dateTime={machineReadable}>{phrasing}</time>;
	}
}
