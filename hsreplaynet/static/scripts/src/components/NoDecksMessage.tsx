import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";

class NoDecksMessage extends React.Component<InjectedTranslateProps> {
	public render(): React.ReactNode {
		const { t } = this.props;
		return (
			<div className="message-wrapper">
				<h2>{t("No deck found")}</h2>
				{this.props.children}
			</div>
		);
	}
}

export default translate()(NoDecksMessage);
