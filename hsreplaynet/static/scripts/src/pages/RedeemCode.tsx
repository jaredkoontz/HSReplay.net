import React from "react";
import { InjectedTranslateProps, Trans, translate } from "react-i18next";
import CSRFElement from "../components/CSRFElement";

interface Props extends InjectedTranslateProps {}
interface State {}

class RedeemCode extends React.Component<Props, State> {
	public render(): React.ReactNode {
		const { t } = this.props;

		return (
			<div className="container">
				<h2>{t("Redeem a code")}</h2>

				<p>
					<Trans>
						Redeem an invitation code or{" "}
						<a href="/premium/">HSReplay.net Premium</a> coupon.
					</Trans>
				</p>
				<form method="POST" action="">
					<CSRFElement />
					<p>
						<label htmlFor="id_uuid">{t("Code:")}</label>{" "}
						<input type="text" name="uuid" size={40} required />
					</p>

					<p>
						<button type="submit" className="btn btn-primary">
							{t("Redeem code")}
						</button>
					</p>
				</form>
			</div>
		);
	}
}

export default translate()(RedeemCode);
