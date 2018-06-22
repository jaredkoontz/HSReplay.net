import { differenceInSeconds } from "date-fns";
import React from "react";
import { i18nDistanceInWords, i18nDistanceInWordsStrict } from "../../i18n";

interface Props {
	from: Date;
	to: Date;
	strict?: boolean;
}

export default class SemanticDuration extends React.Component<Props> {
	public render(): React.ReactNode {
		const { strict, from, to } = this.props;

		const seconds = Math.abs(differenceInSeconds(from, to));
		const machineReadable = `PT${seconds}S`;
		// see https://www.w3.org/TR/2014/REC-html5-20141028/infrastructure.html#valid-duration-string

		const humanReadable = strict
			? i18nDistanceInWordsStrict(from, to)
			: i18nDistanceInWords(from, to);

		return <time dateTime={machineReadable}>{humanReadable}</time>;
	}
}
