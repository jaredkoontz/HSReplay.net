import React from "react";
import { Trans } from "react-i18next";
import { BlizzardAccount as ApiBlizzardAccount } from "../../utils/api";
import PrettyRegion from "./PrettyRegion";

interface Props {
	account: ApiBlizzardAccount;
}

class PrettyBlizzardAccount extends React.Component<Props> {
	public render(): React.ReactNode {
		const { account } = this.props;
		const battletag = account.battletag;
		return (
			<Trans>
				{battletag} (<PrettyRegion region={account.region} />)
			</Trans>
		);
	}
}

export default PrettyBlizzardAccount;
