import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import { PilotExperience } from "../../filters";

interface Props extends InjectedTranslateProps {
	value: PilotExperience;
}

class PrettyPilotExperience extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t, value } = this.props;
		switch (value) {
			case PilotExperience.FIFTY_GAMES:
				return t("50 Games Played");
			case PilotExperience.TWENTYFIVE_GAMES:
				return t("25 Games Played");
			case PilotExperience.TWENTY_GAMES:
				return t("20 Games Played");
			case PilotExperience.TEN_GAMES:
				return t("10 Games Played");
			case PilotExperience.ALL:
				return t("All Pilots");
		}
		return t("Unknown");
	}
}

export default translate()(PrettyPilotExperience);
