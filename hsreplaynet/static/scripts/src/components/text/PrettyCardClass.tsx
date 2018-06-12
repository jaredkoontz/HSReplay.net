import React from "react";
import {
	InjectedI18nProps,
	InjectedTranslateProps,
	translate,
} from "react-i18next";
import { CardClass } from "../../hearthstone";
import { getCardClass } from "../../utils/enums";
import { getCardClassName, getHeroClassName, toTitleCase } from "../../helpers";
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
			return toTitleCase(getCardClassName(cardClass));
		}
		return getHeroClassName(getCardClassName(cardClass), t);
	}
}

export default translate("hearthstone")(PrettyCardClass);
