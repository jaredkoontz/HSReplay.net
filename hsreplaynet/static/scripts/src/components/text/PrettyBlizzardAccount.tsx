import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import { BlizzardAccount as ApiBlizzardAccount } from "../../utils/api";
import PrettyRegion from "./PrettyRegion";

interface Props extends InjectedTranslateProps {
	account: ApiBlizzardAccount;
}

class PrettyBlizzardAccount extends React.Component<Props> {
	public render(): React.ReactNode {
		const { account, t } = this.props;
		return (
			<>
				{account.battletag} (<PrettyRegion region={account.region} />)
			</>
		);
	}
}

export default translate()(PrettyBlizzardAccount);
