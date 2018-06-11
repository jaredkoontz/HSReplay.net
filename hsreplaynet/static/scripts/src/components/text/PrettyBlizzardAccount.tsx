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
			<Trans
				defaults="{battletag} (<0></0>)"
				components={[<PrettyRegion region={account.region} />]}
				tOptions={{ battletag }}
			/>
		);
	}
}

export default PrettyBlizzardAccount;
