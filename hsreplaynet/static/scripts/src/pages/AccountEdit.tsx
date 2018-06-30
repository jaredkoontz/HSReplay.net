import React from "react";
import { InjectedTranslateProps, Trans, translate } from "react-i18next";
import CSRFElement from "../components/CSRFElement";
import { isCollectionDisabled } from "../utils/collection";
import { Visibility } from "../interfaces";

interface Props extends InjectedTranslateProps {
	reflink: string;
	hits: number;
	defaultReplayVisibility: Visibility;
	excludeFromStatistics: boolean;
	joustAutoplay: boolean;
}

interface State {
	collectionSyncingEnabled: boolean;
	joustAutoplayEnabled: boolean;
}

class AccountEdit extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			collectionSyncingEnabled: !isCollectionDisabled(),
			joustAutoplayEnabled: this.props.joustAutoplay,
		};
	}

	componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>) {
		const { collectionSyncingEnabled } = this.state;
		if (prevState.collectionSyncingEnabled !== collectionSyncingEnabled) {
			if (collectionSyncingEnabled) {
				// delete cookie
				document.cookie =
					"disable-collection=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
			} else {
				// set "disabled" cookie
				const d = new Date();
				d.setFullYear(d.getFullYear() + 1);
				document.cookie = `disable-collection=true; expires=${d.toUTCString()}; path=/`;
			}
		}
	}

	public render(): React.ReactNode {
		const { t } = this.props;

		return (
			<form action="" method="post" id="account-form">
				<CSRFElement />

				<section className="box-section">
					<h3>{t("Replays")}</h3>
					<div className="inner">
						<h4>{t("Autoplay")}</h4>
						<p>
							{t(
								"Enable or disable auto-play of replays on the site.",
							)}
						</p>
						<p>
							<label>
								<input
									type="checkbox"
									name="joust_autoplay"
									checked={this.state.joustAutoplayEnabled}
									onChange={e =>
										this.setState({
											joustAutoplayEnabled:
												e.target.checked,
										})
									}
								/>{" "}
								{t(
									"Automatically play replays when viewing them",
								)}
							</label>
						</p>

						<h4>{t("Privacy")}</h4>
						<dl className="dl-horizontal">
							<dt>{t("Public")}</dt>
							<dd>
								{t(
									"Your replays may be appear in listings on the site.",
								)}
							</dd>
							<dt>{t("Unlisted")}</dt>
							<dd>
								{t(
									"Your replays will not appear in such listings. Anyone you share the link to a specific replay with will still be able to view it, however.",
								)}
							</dd>
						</dl>
						<p>
							<select
								name="default_replay_visibility"
								defaultValue={
									"" + this.props.defaultReplayVisibility
								}
							>
								<option value={"" + Visibility.Public}>
									{t("Public")}
								</option>
								<option value={"" + Visibility.Unlisted}>
									{t("Unlisted")}
								</option>
							</select>
						</p>

						<p className="help-block">
							{t(
								"Changing this option will only affect newly uploaded replays. You can always change the visibility for a specific replay on the replay's page.",
							)}
						</p>
					</div>
				</section>

				<section className="box-section">
					<h3>{t("Collection uploading")}</h3>
					<div className="inner">
						<p>
							{t(
								"You can upload your collection using Hearthstone Deck Tracker. Once you've uploaded your collection, we will show you personal dust costs and missing cards.",
							)}
						</p>
						<p>
							<label>
								<input
									id="collection_syncing_checkbox"
									type="checkbox"
									checked={
										this.state.collectionSyncingEnabled
									}
									onChange={e => {
										this.setState({
											collectionSyncingEnabled:
												e.target.checked,
										});
									}}
								/>{" "}
								{t(
									"Enable personal Hearthstone collection features on the site",
								)}
							</label>
						</p>
					</div>
				</section>

				<section id="account-statistics" className="box-section">
					<h3>{t("Statistics contributions")}</h3>
					<div className="inner">
						<p>
							<Trans>
								We analyze games uploaded to HSReplay.net to
								provide data for{" "}
								<a href="/premium/">HSReplay.net Premium</a> and
								sometimes publish findings in our{" "}
								<a
									href="https://articles.hsreplay.net/"
									target="_blank"
									rel="noopener"
								>
									Articles
								</a>{" "}
								and on the{" "}
								<a href="https://hearthsim.info/">
									HearthSim Blog
								</a>.<br />
								<strong>
									The data is always entirely anonymous and
									aggregate.
								</strong>
							</Trans>
						</p>
						<p>
							{t(
								"If you want your data to be excluded from these public results, you can check the option below.",
							)}
						</p>
						<p className="alert alert-warning">
							{t(
								"This option will also prevent new games from appearing in personalized premium features such as My Decks, My Cards and My Statistics for now.",
							)}
							<br />
						</p>
						<p>
							<label>
								<input
									type="checkbox"
									name="exclude_from_statistics"
									defaultChecked={
										this.props.excludeFromStatistics
									}
								/>{" "}
								{t("Exclude my data from aggregate statistics")}
							</label>
						</p>
					</div>
				</section>

				{this.renderReferralSection()}
				<p>
					<button type="submit" className="btn btn-primary">
						{t("Update settings")}
					</button>
				</p>
			</form>
		);
	}

	public renderReferralSection(): React.ReactNode {
		const { reflink, hits, t } = this.props;
		if (!reflink) {
			return null;
		}

		return (
			<section className="box-section">
				<h3>{t("Refer a friend!")}</h3>
				<div className="inner">
					<p>
						<Trans>
							Love the site? Share it with your friends! Send them
							your personalized referral link and earn{" "}
							<strong>$2.50 USD</strong> of Premium credit the
							first time they subscribe to{" "}
							<a href="/premium/">HSReplay.net Premium</a>!
						</Trans>
					</p>

					<p className="text-center">
						<strong style={{ fontSize: "1.5em" }}>
							<a href={reflink}>{reflink}</a>
						</strong>
					</p>

					{hits > 0 ? (
						<p>
							{t(
								"You have referred {hits, plural, one {# friend} other {# friends}} so far. Keep it up!",
								{ hits },
							)}
						</p>
					) : null}
				</div>
			</section>
		);
	}
}

export default translate()(AccountEdit);
