import React from "react";
import { InjectedTranslateProps, Trans, translate } from "react-i18next";
import UserData from "../UserData";
import CSRFElement from "../components/CSRFElement";
import AccountDeleteReason from "../components/account/AccountDeleteReason";

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
					<p>
						<Trans>
							We're sorry to see you go. You can reach out to us
							by email at{" "}
							<a href="mailto:contact@hsreplay.net">
								contact@hsreplay.net
							</a>,{" "}
							<a href="https://discord.gg/hearthsim">
								on Discord
							</a>, or on Twitter{" "}
							<a href="https://twitter.com/HSReplayNet">
								@HSReplayNet
							</a>.
						</Trans>
					</p>
					<Trans>
						<p>Deleting your account will:</p>
						<ul>
							<li>
								Remove all your personal information from the
								site
							</li>
							<li>
								Unlink your Blizzard, Discord and Twitch
								accounts
							</li>
							<li>
								Unlink any application linked to your
								HSReplay.net account (such as Hearthstone Deck
								Tracker).
							</li>
						</ul>
					</Trans>
					<Trans>
						<p>
							Deleting your account <strong>will not</strong>:
						</p>
						<ul>
							<li>
								Reset your statistics. Games are tracked across
								the entire playerbase.
							</li>
							<li>
								Delete your replays. If you wish to delete your
								replays, you can do so{" "}
								<a href="/account/delete/replays/">here</a>.
							</li>
							<li>
								Delete any billing data, or any records we are
								legally obligated to keep.
							</li>
						</ul>
					</Trans>

					<form
						action={""}
						method="POST"
						onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
							if (
								!confirm(
									t(
										"Deleting your account is immediate and cannot be undone. Are you sure you want to proceed?",
									),
								)
							) {
								e.preventDefault();
							}
						}}
					>
						<CSRFElement />

						<h4>{t("Reason for leaving")}</h4>
						<ul>
							<AccountDeleteReason
								value="multiple-accounts"
								reason={t("I have another Blizzard account")}
							>
								Please{" "}
								<a href="mailto:contact@hsreplay.net">
									contact us
								</a>, we can help you by merging your accounts!
							</AccountDeleteReason>
							<AccountDeleteReason
								value="dont-want-premium"
								reason={t("I don't want to pay for Premium")}
							>
								HSReplay.net is entirely usable for free!
								Although Premium is how the site stays afloat,
								you do not have to pay to keep using it.
							</AccountDeleteReason>
							<AccountDeleteReason
								value="reset-stats"
								reason={t(
									"I want to reset my replays or statistics",
								)}
							>
								<strong>Wait!</strong> Deleting your account
								will not currently reset your statistics. This
								is because we track everyone's statistics
								globally.<br />If you want to delete your
								replays, you can simply do so by{" "}
								<a href="/account/delete/replays/">
									clicking here
								</a>.{" "}
							</AccountDeleteReason>
							<AccountDeleteReason
								value="stopped-hearthstone"
								reason={t("I stopped playing Hearthstone")}
							/>
							<AccountDeleteReason
								value="site-problem"
								reason={t("I have a problem with the site")}
							>
								If you're encountering issues, we want to know
								about them. You can contact us at{" "}
								<a href="mailto:contact@hsreplay.net">
									contact@hsreplay.net
								</a>{" "}
								or{" "}
								<a href="https://discord.gg/hearthsim">
									reach out on Discord
								</a>. We answer every email.
							</AccountDeleteReason>
							<AccountDeleteReason
								value="other"
								reason={t("Other (please explain further):")}
							/>
						</ul>

						<h4>{t("Please explain further")}</h4>
						<textarea
							name="message"
							cols={50}
							rows={5}
							className="form-control"
						/>

						<p className="form-group">
							<input
								type="submit"
								className="btn btn-danger"
								value={t("Delete account")}
							/>
							<a href="/" className="btn btn-info">
								{t("Cancel")}
							</a>
						</p>
					</form>
				</div>
			</section>
		);
	}
}

export default translate()(AccountDelete);
