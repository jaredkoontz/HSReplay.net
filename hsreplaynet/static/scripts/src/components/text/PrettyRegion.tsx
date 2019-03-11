import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import { BnetRegion } from "../../hearthstone";

interface Props extends WithTranslation {
	region: BnetRegion;
}

class PrettyRegion extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t, region } = this.props;
		const REGION_NAMES = {
			[BnetRegion.REGION_UNKNOWN]: t("Unknown Region"),
			[BnetRegion.REGION_US]: t("Americas"),
			[BnetRegion.REGION_EU]: t("Europe"),
			[BnetRegion.REGION_KR]: t("Asia"),
			[BnetRegion.REGION_CN]: t("China"),
			[BnetRegion.REGION_PTR]: t("Public Test Realm"),
		};
		return REGION_NAMES[region] || REGION_NAMES[BnetRegion.REGION_UNKNOWN];
	}
}

export default withTranslation()(PrettyRegion);
