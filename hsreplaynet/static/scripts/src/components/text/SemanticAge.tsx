import React from "react";
import {
	i18nDistanceInWordsStrict,
	i18nDistanceInWordsToNow,
} from "../../i18n";

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

		const dateOpts = {
			addSuffix: !noSuffix,
		};
		const phrasing = strict
			? i18nDistanceInWordsStrict(new Date(), date, dateOpts)
			: i18nDistanceInWordsToNow(date, dateOpts);

		return <time dateTime={date.toISOString()}>{phrasing}</time>;
	}
}
