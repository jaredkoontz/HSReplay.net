import React from "react";
import { InjectedTranslateProps, Trans, translate } from "react-i18next";
import UserData from "../UserData";
import PrettyBlizzardAccount from "../components/text/PrettyBlizzardAccount";
import { getCookie } from "../helpers";

interface Props extends InjectedTranslateProps {
	blizzardUrl: string;
	discordUrl: string;
	twitchUrl: string;
}
interface State {}

class AccountConnections extends React.Component<Props, State> {
	public render(): React.ReactNode {
		const { t } = this.props;

		return (
			<>
				<section id="account-blizzard-link" className="box-section">
					<h3>{t("Connect with Blizzard")}</h3>
					<div className="inner">
						<p>
							{t(
								"Here, you can connect multiple Blizzard accounts to your HSReplay.net account. This lets you sign in with any of them.",
							)}
						</p>

						<form method="GET" action={this.props.blizzardUrl}>
							<input
								type="hidden"
								name="process"
								value="connect"
							/>

							<p>
								<label htmlFor="id_region">{t("Region")}</label>
								<select
									name="region"
									id="id_region"
									className="sm form-control"
								>
									<option value="us">{t("Americas")}</option>
									<option value="eu">{t("Europe")}</option>
									<option value="kr">{t("Asia")}</option>
									<option value="sea">
										{t("South East Asia")}
									</option>
									<option value="tw">{t("Taiwan")}</option>
									<option value="cn">{t("China")}</option>
								</select>
							</p>

							<p>
								<a
									href="https://battle.net/en/?logout"
									target="_blank"
									rel="noopener"
									className="btn btn-default"
								>
									{t("1. Sign out of Blizzard")}
								</a>{" "}
								<button
									type="submit"
									className="btn btn-primary"
								>
									{t("2. Connect a Blizzard account")}
								</button>
							</p>

							<p className="alert alert-info">
								{t(
									"Make sure to sign out of Blizzard before adding another account. This does not sign you out of HSReplay.net.",
								)}
							</p>
						</form>
					</div>
				</section>

				<section id="account-discord-link" className="box-section">
					<h3>{t("Connect with Discord")}</h3>
					<div className="inner">
						<p>
							{UserData.isPremium() ? (
								<Trans>
									As a subscriber, you have access to the
									exclusive{" "}
									<strong style={{ color: "#dc9502" }}>
										Premium Supporter
									</strong>{" "}
									role on{" "}
									<a
										href="https://discord.gg/hearthsim"
										target="_blank"
									>
										our official Discord server
									</a>. Connect your Discord account here to
									do so.
								</Trans>
							) : (
								<Trans>
									<a href="/premium/">Premium subscribers</a>{" "}
									can connect their Discord account and get a{" "}
									<strong style={{ color: "#dc9502" }}>
										special role
									</strong>{" "}
									on the{" "}
									<a
										href="https://discord.gg/hearthsim"
										target="_blank"
										rel="noopener"
									>
										official HearthSim Discord
									</a>!
								</Trans>
							)}
						</p>

						<form method="GET" action={this.props.discordUrl}>
							<input
								type="hidden"
								name="process"
								value="connect"
							/>
							<p>
								<button
									type="submit"
									className="btn btn-primary"
								>
									{t("Connect a Discord account")}
								</button>
							</p>
						</form>
					</div>
				</section>

				<section id="account-twitch-link" className="box-section">
					<h3>{t("Connect with Twitch")}</h3>
					<div className="inner">
						<p>
							<Trans>
								Do you stream Hearthstone on Twitch? Check out
								the{" "}
								<a
									href="https://articles.hsreplay.net/2017/10/26/twitch-extension-for-hearthstone-deck-tracker/"
									rel="noopener"
								>
									Twitch Extension for Hearthstone Deck
									Tracker
								</a>. Connect your account here to set it up!
							</Trans>
						</p>
						<form method="GET" action={this.props.twitchUrl}>
							<input
								type="hidden"
								name="process"
								value="connect"
							/>
							<p>
								<button
									type="submit"
									className="btn btn-primary"
								>
									{t("Connect a Twitch account")}
								</button>
							</p>
						</form>
					</div>
				</section>

				<section id="account-blizzard-accounts" className="box-section">
					<h3>{t("Hearthstone accounts")}</h3>
					<div className="inner">
						<p>
							{t(
								"We have automatically detected the following Hearthstone accounts and associated them with you. You can see statistics and upload your collection for any of these accounts.",
							)}
						</p>

						{this.renderAccounts()}
					</div>
				</section>
			</>
		);
	}

	private renderAccounts(): React.ReactNode {
		const { t } = this.props;
		const accountList = UserData.getAccounts();
		if (!accountList.length) {
			return (
				<Trans>
					You do not have any connected Hearthstone account.
					<a href="/downloads/">Download a Deck Tracker</a> and start
					uploading games!
				</Trans>
			);
		}

		const csrfToken = getCookie("csrftoken");

		return (
			<>
				{Object.keys(accountList).map(key => (
					<li key={key} className="list-group-item">
						<button
							type="submit"
							className="btn btn-danger pull-right"
							onClick={e => {
								if (
									!confirm(
										t(
											"By removing this account, you will no longer be able to access its statistics. To recover it, upload some replays with that account!",
										),
									)
								) {
									return;
								}
								const btn = e.currentTarget;
								btn.setAttribute("disabled", "disabled");
								fetch(
									`/api/v1/account/unlink/?region=${
										accountList[key].region
									}&account_lo=${
										accountList[key].account_lo
									}`,
									{
										method: "DELETE",
										credentials: "include",
										headers: {
											"X-CSRFToken": csrfToken,
										},
									},
								)
									.then(response => {
										if (response.status !== 200) {
											alert(
												t(
													"Error removing Hearthstone account.",
												),
											);
											throw new Error(
												"Invalid response code",
											);
										}
									})
									.then(() => {
										btn.parentElement.remove();
									})
									.catch(error => {
										btn.removeAttribute("disabled");
										console.error(error);
									});
							}}
						>
							{t("Remove")}
						</button>
						<strong>
							<PrettyBlizzardAccount account={accountList[key]} />
						</strong>
						<div className="clearfix" />
					</li>
				))}
			</>
		);
	}
}

export default translate()(AccountConnections);
