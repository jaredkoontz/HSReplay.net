import React from "react";
import { BlizzardAccount } from "../../utils/api";
import { Trans } from "react-i18next";
import PrettyBlizzardAccount from "../text/PrettyBlizzardAccount";

interface Props {
	account: BlizzardAccount;
	feature: string;
}

export default class AllSet extends React.Component<Props> {
	public render(): React.ReactNode {
		return (
			<>
				<h2>
					<Trans>All set!</Trans>
				</h2>
				<p>
					<Trans
						defaults="We found your Hearthstone account <0></0> and will analyze incoming replays."
						components={[
							<PrettyBlizzardAccount
								key={0}
								account={this.props.account}
							/>,
						]}
					/>
				</p>
				<p>
					<Trans
						defaults="After you've played some games, you'll find {feature} right here."
						tOptions={{
							feature: this.props.feature,
						}}
					/>
				</p>
				<p className="text-muted">
					<Trans>
						Note: It may take a few hours for new data to appear on
						this page. If you are missing data, make sure the
						filters in the sidebar are correct!
					</Trans>
				</p>
			</>
		);
	}
}
