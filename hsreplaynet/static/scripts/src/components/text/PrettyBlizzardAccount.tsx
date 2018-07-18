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
		const battletag = account.battletag;
		let result = (
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
		if (!this.props.plain) {
			result = <strong>{result}</strong>;
		}
		return result;
	}
}

export default PrettyBlizzardAccount;
