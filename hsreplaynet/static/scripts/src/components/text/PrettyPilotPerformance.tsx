import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import { PilotPerformance } from "../../filters";

interface Props extends InjectedTranslateProps {
	value: PilotPerformance;
}

class PrettyPilotPerformance extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t, value } = this.props;
		switch (value) {
			case PilotPerformance.TOP_20TH_PERCENTILE:
				return t("Top 20%");
			case PilotPerformance.TOP_50TH_PERCENTILE:
				return t("Top 50%");
			case PilotPerformance.ALL:
				return t("All Pilots");
		}
		return t("Unknown");
	}
}

export default translate()(PrettyPilotPerformance);
