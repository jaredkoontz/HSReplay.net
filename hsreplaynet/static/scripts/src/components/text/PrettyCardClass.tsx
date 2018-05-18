import React from "react";
import {
	InjectedI18nProps,
	InjectedTranslateProps,
	translate,
} from "react-i18next";
import { CardClass } from "../../hearthstone";
import { getCardClass } from "../../utils/enums";
import { getCardClassName, getHeroClassName } from "../../helpers";
import UserData from "../../UserData";

interface Props extends InjectedTranslateProps, InjectedI18nProps {
	cardClass: CardClass | string;
}

class PrettyCardClass extends React.Component<Props> {
	render(): React.ReactNode {
		const { t, i18n } = this.props;
		const cardClass = getCardClass(this.props.cardClass);

		if (
			!i18n.hasResourceBundle(i18n.language, "hearthstone") ||
			!UserData.hasFeature("frontend-translations")
		) {
			return getHeroClassName(getCardClassName(cardClass));
		}

		switch (cardClass) {
			case CardClass.DEATHKNIGHT:
				return t("GLOBAL_CLASS_DEATHKNIGHT");
			case CardClass.DRUID:
				return t("GLOBAL_CLASS_DRUID");
			case CardClass.HUNTER:
				return t("GLOBAL_CLASS_HUNTER");
			case CardClass.MAGE:
				return t("GLOBAL_CLASS_MAGE");
			case CardClass.PALADIN:
				return t("GLOBAL_CLASS_PALADIN");
			case CardClass.PRIEST:
				return t("GLOBAL_CLASS_PRIEST");
			case CardClass.ROGUE:
				return t("GLOBAL_CLASS_ROGUE");
			case CardClass.SHAMAN:
				return t("GLOBAL_CLASS_SHAMAN");
			case CardClass.WARLOCK:
				return t("GLOBAL_CLASS_WARLOCK");
			case CardClass.WARRIOR:
				return t("GLOBAL_CLASS_WARRIOR");
			case CardClass.NEUTRAL:
				return t("GLOBAL_CLASS_NEUTRAL");
		}

		return t("Unknown class");
	}
}

export default translate("hearthstone")(PrettyCardClass);
