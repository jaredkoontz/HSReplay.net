import React from "react";
import * as moment from "moment";

interface Props {
	date?: Date;
	noSuffix?: boolean;
}

interface State {
	counter: number;
}

export default class SemanticAge extends React.Component<Props, State> {
	private interval: number;

	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			counter: 0
		};
	}

	public componentDidMount(): void {
		this.interval = window.setInterval(() => {
			// update state to refresh the timestamp
			this.setState(state => ({
				counter: state.counter + 1 % 100
			}));
		}, 5000);
	}

	public componentWillUnmount(): void {
		window.clearInterval(this.interval);
	}

	public render(): React.ReactNode {
		const { date, noSuffix } = this.props;

		if (!date || !(date instanceof Date)) {
			return null;
		}

		// for now, set this globally on every render
		moment.relativeTimeThreshold("m", 60);

		const machineReadable = date.toISOString();
		const phrasing = moment(date)
			.utc()
			.fromNow(!!noSuffix);

		return <time dateTime={machineReadable}>{phrasing}</time>;
	}
}
