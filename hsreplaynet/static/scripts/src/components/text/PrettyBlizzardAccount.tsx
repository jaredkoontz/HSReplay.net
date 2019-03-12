import React from "react";
import { Trans } from "react-i18next";
import { BlizzardAccount as ApiBlizzardAccount } from "../../utils/api";
import PrettyRegion from "./PrettyRegion";

interface Props {
	account: ApiBlizzardAccount;
	plain?: boolean;
}

class PrettyBlizzardAccount extends React.Component<Props> {
	public render(): React.ReactNode {
		const { account } = this.props;
		let result = <Trans>Unknown account</Trans>;
		if (account && account.battletag) {
			const battletag = account.battletag;
			result = (
				<Trans
					defaults="{battletag} (<0></0>)"
					components={[
						<PrettyRegion
							region={account.region}
							key={account.account_lo}
						/>,
					]}
					tOptions={{ battletag }}
				/>
			);
		}
		if (!this.props.plain) {
			result = <strong>{result}</strong>;
		}
		return result;
	}
}

export default PrettyBlizzardAccount;
