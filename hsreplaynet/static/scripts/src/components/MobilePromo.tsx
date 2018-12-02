import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import UserData from "../UserData";
import DownloadButton from "./DownloadButton";
import Panel from "./Panel";

interface Props extends InjectedTranslateProps {
	onClose: () => void;
}

class MobilePromo extends React.Component<Props> {
	private setting: string = "closed-mobile-promo-arcane-tracker";

	constructor(props: Props, context?: any) {
		super(props, context);
		if (
			!this.hasSetting() &&
			window.location.search.indexOf("utm_source=arcanetracker") !== -1
		) {
			UserData.setSetting(this.setting, "1");
		}
	}

	private hasSetting(): boolean {
		return UserData.getSetting(this.setting) === "1";
	}

	render() {
		const { t, onClose } = this.props;
		if (navigator.userAgent.toLowerCase().indexOf("android") === -1) {
			return null;
		}
		if (!UserData.hasFeature("arcane-tracker")) {
			return null;
		}
		if (UserData.getSetting(this.setting) === "1") {
			return null;
		}
		return (
			<Panel
				header={
					<>
						<span>{t("Don't you have a phone?")}</span>
						<a
							href="#"
							className="btn mobile-promo-close"
							onClick={e => {
								e.preventDefault();
								UserData.setSetting(this.setting, "1");
								onClose();
							}}
						>
							<span className="glyphicon glyphicon-remove" />
						</a>
					</>
				}
			>
				<h2>
					{t("Hearthstone Deck Tracker is now available on Android!")}
				</h2>
				<DownloadButton
					id="Android-promo"
					icon="android"
					title={t("Download")}
					subtitle="Arcane Tracker"
					url="https://play.google.com/store/apps/details?id=net.mbonnin.arcanetracker"
					target="_blank"
				/>
			</Panel>
		);
	}
}

export default translate()(MobilePromo);
