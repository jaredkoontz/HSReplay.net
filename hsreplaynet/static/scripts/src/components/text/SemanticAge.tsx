import { distanceInWordsStrict, distanceInWordsToNow } from "date-fns";
import React from "react";

interface Props {
	date?: Date | string;
	noSuffix?: boolean;
	strict?: boolean;
}

export default class SemanticAge extends React.Component<Props> {
	private timeout: number;

	private startUpdates(): void {
		this.timeout = window.setTimeout(() => {
			this.forceUpdate(() => this.startUpdates());
		}, 10000);
	}

	private stopUpdates(): void {
		window.clearTimeout(this.timeout);
	}

	public componentDidMount(): void {
		this.startUpdates();
	}

	public componentWillUnmount(): void {
		this.stopUpdates();
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
