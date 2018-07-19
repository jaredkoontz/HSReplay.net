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
						<Trans
							defaults="We're sorry to see you go. You can reach out to us by email at <0>{emailAddress}</0>, <1>on Discord</1> or on Twitter <2>{twitterHandle}</2>"
							components={[
								<a href={`mailto:${SITE_EMAIL}`} key={0}>
									0
								</a>,
								<a href="https://discord.gg/hearthsim" key={1}>
									on Discord
								</a>,
								<a
									href="https://twitter.com/HSReplayNet"
									key={2}
								>
									2
								</a>,
							]}
							tOptions={{
								emailAddress: SITE_EMAIL,
								twitterHandle: "@HSReplayNet",
							}}
						/>
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
								<Trans
									defaults="Please <0>contact us</0>, we can help you by merging your accounts!"
									components={[
										<a
											href={`mailto:${SITE_EMAIL}`}
											key={0}
										>
											0
										</a>,
									]}
								/>
							</AccountDeleteReason>
							<AccountDeleteReason
								value="dont-want-premium"
								reason={t("I don't want to pay for Premium")}
							>
								<Trans>
									HSReplay.net is entirely usable for free!
									Although Premium is how the site stays
									afloat, you do not have to pay to keep using
									it.
								</Trans>
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
								<Trans
									defaults="If you're encountering issues, we want to know about them. You can contact us at <0>{emailAddress}</0> or <1>reach out on Discord</1>. We answer every email."
									components={[
										<a
											href={`mailto:${SITE_EMAIL}`}
											key={0}
										>
											0
										</a>,
										<a
											href="https://discord.gg/hearthsim"
											key={1}
										>
											1
										</a>,
									]}
									tOptions={{ emailAddress: SITE_EMAIL }}
								/>
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
