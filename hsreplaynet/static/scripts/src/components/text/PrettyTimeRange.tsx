import React from "react";
import {
	InjectedTranslateProps,
	translate,
	TranslationFunction,
} from "react-i18next";
import { TimeRange } from "../../filters";

interface Props extends InjectedTranslateProps {
	timeRange: keyof typeof TimeRange;
}

export function prettyTimeRange(timeRange: string, t: TranslationFunction) {
	const matches = /^LAST_(\d+)_DAYS?$/.exec("" + timeRange);
	if (matches !== null) {
		return t("Last {n, plural, one {# day} other {# days}}", {
			n: +matches[1],
		});
	}

	switch (timeRange) {
		case TimeRange.CURRENT_SEASON:
			return t("Current season");
		case TimeRange.PREVIOUS_SEASON:
			return t("Previous season");
		case TimeRange.CURRENT_EXPANSION:
			return t("Latest expansion");
		case TimeRange.CURRENT_PATCH:
			return t("Latest patch");
		case TimeRange.ARENA_EVENT:
			return t("Arena event");
	}

	return timeRange;
}

class PrettyTimeRange extends React.Component<Props> {
	public render(): React.ReactNode {
		return prettyTimeRange(this.props.timeRange, this.props.t);
	}
}

export default translate()(PrettyTimeRange);
