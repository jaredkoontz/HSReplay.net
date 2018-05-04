import React from "react";
import { BnetRegion } from "../../hearthstone";
import { BlizzardAccount as ApiBlizzardAccount } from "../../utils/api";
import { InjectedTranslateProps, translate } from "react-i18next";

interface Props extends InjectedTranslateProps {
	account: ApiBlizzardAccount;
}

class PrettyBlizzardAccount extends React.Component<Props> {
	public render(): React.ReactNode {
		const { account, t } = this.props;
		const REGION_NAMES = {
			[BnetRegion.REGION_UNKNOWN]: t("Unknown Region"),
			[BnetRegion.REGION_US]: t("Americas"),
			[BnetRegion.REGION_EU]: t("Europe"),
			[BnetRegion.REGION_KR]: t("Asia"),
			[BnetRegion.REGION_CN]: t("China"),
			[BnetRegion.REGION_PTR]: t("Public Test Realm"),
		};
		const region =
			REGION_NAMES[account.region] ||
			REGION_NAMES[BnetRegion.REGION_UNKNOWN];
		return (
			<>
				{account.battletag} ({region})
			</>
		);
	}
}

export default translate()(PrettyBlizzardAccount);
