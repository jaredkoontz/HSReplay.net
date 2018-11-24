import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import UserData from "../UserData";
import DownloadButton from "./DownloadButton";
import Panel from "./Panel";

interface Props extends InjectedTranslateProps {
	onClose: () => void;
}

const MobilePromo: React.SFC<Props> = ({ t, onClose }) => {
	if (navigator.userAgent.toLowerCase().indexOf("android") === -1) {
		return null;
	}
	if (!UserData.hasFeature("arcane-tracker")) {
		return null;
	}
	const setting = "closed-mobile-promo-arcane-tracker";
	if (UserData.getSetting(setting) === "1") {
		return null;
	}
	return (
		<Panel
			header={
				<>
					<span>{t("Do you have a phone?")}</span>
					<a
						href="#"
						className="btn mobile-promo-close"
						onClick={e => {
							e.preventDefault();
							UserData.setSetting(setting, "1");
							onClose();
						}}
					>
						<span className="glyphicon glyphicon-remove" />
					</a>
				</>
			}
		>
			<h2>
				{t("Hearthstone Deck Tracker is now avaialable on Android!")}
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
};

export default translate()(MobilePromo);
