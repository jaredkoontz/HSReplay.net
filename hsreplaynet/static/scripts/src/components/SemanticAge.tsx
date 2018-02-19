import React from "react";
import * as moment from "moment";

interface Props extends React.ClassAttributes<SemanticAge> {
	date?: Date;
	noSuffix?: boolean;
}

interface State {
	counter: number;
}

export default class SemanticAge extends React.Component<Props, State> {
	private interval: number;

	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			counter: 0,
		};
	}

	componentDidMount() {
		this.interval = window.setInterval(() => {
			// update state to refresh the timestamp
			this.setState(state => ({
				counter: state.counter + 1 % 100,
			}));
		}, 5000);
	}

	componentWillUnmount() {
		window.clearInterval(this.interval);
	}

	render(): JSX.Element {
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
