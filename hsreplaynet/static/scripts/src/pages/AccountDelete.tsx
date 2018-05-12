import React from "react";
import { InjectedTranslateProps, Trans, translate } from "react-i18next";
import UserData from "../UserData";
import CSRFElement from "../components/CSRFElement";

interface Props extends InjectedTranslateProps {}
interface State {}

class AccountDelete extends React.Component<Props, State> {
	public render(): React.ReactNode {
		const { t } = this.props;

		if (UserData.isPremium()) {
			return (
				<div className="alert alert-danger">
					<Trans>
						You are currently on an HSReplay.net Premium
						subscription. You cannot delete your account while the
						subscription is running. Please{" "}
						<a href="/account/billing/">cancel your subscription</a>{" "}
						first.<br />
						Note that you can keep using the site for free after
						cancelling, you do not have to delete your account!
					</Trans>
				</div>
			);
		}

		return (
			<section className="box-section">
				<h3>{t("Delete account")}</h3>
				<div className="inner">
					<p className="alert alert-warning">
						<Trans>
							<strong>
								Did you log in with the wrong Blizzard account?
							</strong>
							<br />
							You can link multiple Blizzard accounts{" "}
							<a href="/account/social/connections/#account-connections">
								in the Connected accounts section
							</a>. If you need to merge an account,{" "}
							<a href="mailto:contact@hsreplay.net">
								contact us directly
							</a>.
						</Trans>
					</p>

					<p>
						<Trans>
							Problems with the site? Something you're not happy
							about? Maybe we can fix it.{" "}
							<a href="mailto:{{ site_email }}">
								Shoot us an email
							</a>!
						</Trans>
					</p>
					<form action={""} method="POST">
						<CSRFElement />
						<p>
							{t(
								"Once your data is gone, it's irreversible. Are you sure?",
							)}
						</p>
						<p className={"form-group"}>
							<label>
								<input
									name="delete_confirm"
									type="checkbox"
									required
								/>{" "}
								<strong>
									{t("I understand. Delete my account.")}
								</strong>
							</label>
							<br />
							<label>
								<input name="delete_replays" type="checkbox" />{" "}
								{t("Also delete my replay data")}
							</label>
						</p>

						<p>
							<textarea
								name="delete_reason"
								placeholder={t("Tell us why you're leaving")}
								cols={50}
								rows={5}
								className="form-control"
							/>
						</p>
						<p>
							<em>
								{t(
									"Note: Accounts are deleted after a week. Logging back in before that will cancel the request.",
								)}
							</em>
						</p>
						<p className={"form-group"}>
							<input
								type="submit"
								className="btn btn-danger"
								value={t("Confirm")}
							/>
						</p>
					</form>
				</div>
			</section>
		);
	}
}

export default translate()(AccountDelete);
