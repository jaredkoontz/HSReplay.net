import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import { PlayerExperience } from "../../filters";

interface Props extends WithTranslation {
	value: PlayerExperience;
}

class PrettyPlayerExperience extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t, value } = this.props;
		switch (value) {
			case PlayerExperience.FIFTY_GAMES:
				return t("{n} games played", { n: 50 });
			case PlayerExperience.TWENTYFIVE_GAMES:
				return t("{n} games played", { n: 25 });
			case PlayerExperience.TWENTY_GAMES:
				return t("{n} games played", { n: 20 });
			case PlayerExperience.TEN_GAMES:
				return t("{n} games played", { n: 10 });
			case PlayerExperience.ALL:
				return t("All players");
		}
		return t("Unknown");
	}
}

export default withTranslation()(PrettyPlayerExperience);
