import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import { CardClass } from "../../hearthstone";
import { getCardClassName, getHeroClassName, toTitleCase } from "../../helpers";
import { getCardClass } from "../../utils/enums";

interface Props extends WithTranslation {
	cardClass: CardClass | string;
}

class PrettyCardClass extends React.Component<Props> {
	render(): React.ReactNode {
		const { t, i18n } = this.props;
		const cardClass = getCardClass(this.props.cardClass);

		if (!i18n.hasResourceBundle(i18n.language || "en", "hearthstone")) {
			return toTitleCase(getCardClassName(cardClass));
		}
		const text = getHeroClassName(getCardClassName(cardClass), t);
		if (this.props.children) {
			const fn: (text: string) => React.ReactNode = this.props
				.children as any;
			return fn(text);
		}
		return text;
	}
}

export default withTranslation()(PrettyCardClass);
