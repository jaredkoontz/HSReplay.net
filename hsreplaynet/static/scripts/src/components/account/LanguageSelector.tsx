import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import { default as UserData } from "../../UserData";
import DropdownMenu from "../layout/DropdownMenu";

interface Props extends WithTranslation {
	next: string;
}

interface State {
	activeLanguage: string;
}

class LanguageSelector extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			activeLanguage:
				document.getElementsByTagName("html")[0].getAttribute("lang") ||
				"en",
		};
	}

	public render(): React.ReactNode {
		const { t } = this.props;
		const languages = UserData.getLanguages();

		return (
			<DropdownMenu
				label={languages[this.state.activeLanguage] || t("Language")}
				glyphicon="globe"
				id="navbar-language-selector"
			>
				{Object.keys(languages).map(lang => (
					<li
						className={
							lang === this.state.activeLanguage ? "active" : ""
						}
						key={lang}
					>
						<a
							href={`/i18n/setprefs/?hl=${lang}&next=${
								this.props.next
							}`}
						>
							{languages[lang]}
						</a>
					</li>
				))}
				<li className="text-muted small">
					<a href="/i18n/contribute/" target="_blank" rel="noopener">
						{t("Help translate HSReplay.net!")}
					</a>
				</li>
			</DropdownMenu>
		);
	}
}

export default withTranslation()(LanguageSelector);
