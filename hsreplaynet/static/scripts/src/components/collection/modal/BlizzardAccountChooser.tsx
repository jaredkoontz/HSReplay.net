import React from "react";
import { BlizzardAccount } from "../../../utils/api";
import PrettyBlizzardAccount from "../../text/PrettyBlizzardAccount";
import { InjectedTranslateProps, translate } from "react-i18next";

interface Props extends InjectedTranslateProps {
	id?: string;
	accounts: { [account: string]: BlizzardAccount };
	account: string;
	setAccount: (account: string) => any;
	note?: React.ReactNode;
}

class BlizzardAccountChooser extends React.Component<Props> {
	static defaultProps = {
		id: "collection-select-blizzard-account",
	};

	private selectAccount = (event: React.ChangeEvent<HTMLSelectElement>) => {
		this.props.setAccount(event.target.value);
	};

	public render(): React.ReactNode {
		const { t } = this.props;

		const accountKeys = Object.keys(this.props.accounts);
		if (accountKeys.length <= 1) {
			return null;
		}

		return (
			<section id={this.props.id}>
				<h2>{t("Select your account")}</h2>
				<p>
					{t("Select the Hearthstone account you'd like to set up:")}
				</p>
				<div className="form-group">
					<select
						value={this.props.account}
						onChange={this.selectAccount}
						className="form-control input-lg"
					>
						{Object.keys(this.props.accounts).map(key => {
							const account = this.props.accounts[key];
							return (
								<option value={key} key={key}>
									<PrettyBlizzardAccount account={account} />
								</option>
							);
						})}
					</select>
					{this.props.note ? (
						<p className="help-block">{this.props.note}</p>
					) : null}
				</div>
			</section>
		);
	}
}

export default translate()(BlizzardAccountChooser);
