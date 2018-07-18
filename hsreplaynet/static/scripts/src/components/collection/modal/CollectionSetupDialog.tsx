import { cookie } from "cookie_js";
import React from "react";
import { InjectedTranslateProps, Trans, translate } from "react-i18next";
import { image } from "../../../helpers";
import { CollectionEvents } from "../../../metrics/GoogleAnalytics";
import { getAccountKey } from "../../../utils/account";
import { BlizzardAccount } from "../../../utils/api";
import { isCollectionDisabled } from "../../../utils/collection";
import Feature from "../../Feature";
import LoginButton from "../../account/LoginButton";
import CloseModalButton from "../../modal/CloseModalButton";
import PrettyBlizzardAccount from "../../text/PrettyBlizzardAccount";
import DownloadSection from "./DownloadSection";
import ModalAwait from "./ModalAwait";
import ProgressIndicator from "./ProgressIndicator";

interface Props extends InjectedTranslateProps {
	isAuthenticated: boolean;
	hasConnectedHDT: boolean;
	blizzardAccount: BlizzardAccount | null;
	hasCollection: boolean;
	hasTokens: boolean;
	hasMultipleBlizzardAccounts: boolean;
	refreshAccount: () => any;
	refreshCollection: () => any;
}

export const enum Step {
	SIGN_IN = 1,
	CONNECT_HDT = 2,
	CLAIM_ACCOUNT = 3,
	UPLOAD_COLLECTION = 4,
	COMPLETE = 5,
	COLLECTION_DISABLED = 6,
}

const LAST_STEP = Step.COMPLETE;

interface State {
	step: Step;
	previousStep: Step | null;
}

class CollectionSetupDialog extends React.Component<Props, State> {
	private interval: number | null = null;

	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			step: CollectionSetupDialog.getStep(
				props.isAuthenticated,
				props.hasConnectedHDT,
				props.blizzardAccount,
				props.hasCollection,
			),
			previousStep: null,
		};
	}

	private static getStep(
		isAuthenticated: boolean,
		hasConnectedHDT: boolean,
		blizzardAccount: BlizzardAccount | null,
		hasCollection: boolean,
	): Step {
		if (isCollectionDisabled()) {
			return Step.COLLECTION_DISABLED;
		}
		if (!isAuthenticated) {
			return Step.SIGN_IN;
		}
		if (!hasConnectedHDT) {
			return Step.CONNECT_HDT;
		}
		if (blizzardAccount === null) {
			return Step.CLAIM_ACCOUNT;
		}
		if (!hasCollection) {
			return Step.UPLOAD_COLLECTION;
		}
		return Step.COMPLETE;
	}

	public componentWillReceiveProps(
		nextProps: Readonly<Props>,
		nextContext: any,
	): void {
		if (
			nextProps.isAuthenticated !== this.props.isAuthenticated ||
			nextProps.hasConnectedHDT !== this.props.hasConnectedHDT ||
			nextProps.blizzardAccount !== this.props.blizzardAccount ||
			nextProps.hasCollection !== this.props.hasCollection
		) {
			this.setState(state => ({
				step: CollectionSetupDialog.getStep(
					nextProps.isAuthenticated,
					nextProps.hasConnectedHDT,
					nextProps.blizzardAccount,
					nextProps.hasCollection,
				),
				previousStep: state.step,
			}));
		}
	}

	public componentDidUpdate(
		prevProps: Readonly<Props>,
		prevState: Readonly<State>,
		prevContext: any,
	): void {
		if (
			prevProps.blizzardAccount !== this.props.blizzardAccount &&
			this.state.step === Step.UPLOAD_COLLECTION
		) {
			this.props.refreshCollection();
		}
		if (this.state.step !== prevState.step) {
			this.trackStep(this.state.step);
		}
	}

	private trackStep(step: Step) {
		CollectionEvents.onEnterModalStep(step);
	}

	private refresh(): void {
		switch (this.state.step) {
			case Step.CONNECT_HDT:
			case Step.CLAIM_ACCOUNT:
				this.props.refreshAccount();
				break;
			case Step.UPLOAD_COLLECTION:
				this.props.refreshCollection();
				break;
		}
	}

	private clearInterval(): void {
		if (this.interval === null) {
			return;
		}
		window.clearInterval(this.interval);
	}

	private scheduleInterval(): void {
		this.clearInterval();
		this.interval = window.setInterval(() => this.refresh(), 10 * 1000);
	}

	private visibilityChange = () => {
		if (document.hidden) {
			return;
		}
		this.clearInterval();
		this.refresh();
		this.scheduleInterval();
	};

	public componentDidMount(): void {
		this.scheduleInterval();
		document.addEventListener(
			"visibilitychange",
			this.visibilityChange,
			false,
		);
		this.trackStep(this.state.step);
	}

	public componentWillUnmount(): void {
		this.clearInterval();
		document.removeEventListener("visibilitychange", this.visibilityChange);
	}

	private renderStep(): React.ReactNode {
		const { step } = this.state;
		const { blizzardAccount, t } = this.props;

		if (step === Step.SIGN_IN) {
			const next =
				document &&
				document.location &&
				document.location.pathname &&
				document.location.pathname + "?modal=collection";
			return (
				<>
					<section
						id="collection-setup-sign-in"
						className="text-center"
					>
						<h2>{t("Sign in to get started")}</h2>
						<LoginButton next={next} />
					</section>
				</>
			);
		}

		switch (step) {
			case Step.CONNECT_HDT:
				return (
					<>
						<DownloadSection
							hasLegacyClient={this.props.hasTokens}
						/>
						<section id="collection-setup-connect-tracker">
							<h2>{t("Setup instructions")}</h2>
							<ol>
								<li>
									{this.props.hasTokens
										? t(
												"Run the latest version of Hearthstone Deck Tracker",
										  )
										: t(
												"Download and install Hearthstone Deck Tracker",
										  )}
								</li>
								<li>
									{t(
										"Click on the blue HSReplay.net banner at the top of your deck tracker",
									)}
									{this.props.hasTokens ? (
										<>
											<br />
											<span className="text-help">
												{t(
													"Note: You'll need to do this even if you've claimed replays in the past.",
												)}
											</span>
										</>
									) : null}
								</li>
								<li>
									{t(
										"Make sure you're signed in to HSReplay.net",
									)}
								</li>
							</ol>
						</section>
						<ModalAwait>
							{t("Waiting for your deck tracker…")}
						</ModalAwait>
					</>
				);
			case Step.CLAIM_ACCOUNT:
				return (
					<>
						<DownloadSection
							hasLegacyClient={this.props.hasTokens}
						/>
						<section id="collection-setup-blizzard-account">
							<h2>{t("Connect Hearthstone")}</h2>
							<p>
								{t(
									"Launch Hearthstone while your deck tracker is running and enter your collection.",
								)}
							</p>
						</section>
						<ModalAwait>{t("Waiting for Hearthstone…")}</ModalAwait>
					</>
				);
			case Step.UPLOAD_COLLECTION:
				return (
					<>
						<section id="collection-setup-upload">
							<h2>{t("Upload your Collection")}</h2>
							{this.state.previousStep === Step.CLAIM_ACCOUNT ? (
								<>
									<p>
										<Trans>
											We found your account{" "}
											<PrettyBlizzardAccount
												account={blizzardAccount}
											/>.
										</Trans>
									</p>
									<p>
										{t(
											"Now enter your collection in Hearthstone to complete the setup.",
										)}
									</p>
									<p className="text-help">
										{t(
											"Note: Make sure the deck tracker is still running.",
										)}
									</p>
								</>
							) : (
								<>
									<p>{t("You're almost done!")}</p>
									<ol>
										<li>{t("Launch your deck tracker")}</li>
										<li>{t("Launch Hearthstone")}</li>
										<li>{t("Enter your collection")}</li>
									</ol>
									<p className="text-help">
										<Trans>
											Make sure you're logged in to
											Blizzard as{" "}
											<PrettyBlizzardAccount
												account={blizzardAccount}
											/>.
										</Trans>
										{this.props
											.hasMultipleBlizzardAccounts ? (
											<>
												<br />
												{t(
													"Setup another account by clicking on your account in the top right.",
												)}
											</>
										) : null}
									</p>
								</>
							)}
						</section>
						<ModalAwait>
							{t("Waiting for your collection…")}
						</ModalAwait>
					</>
				);
			case Step.COMPLETE:
				return (
					<>
						<section id="collection-setup-done">
							<h2 className="text-center">
								{t("Setup complete!")}
							</h2>
							<p className="text-center">
								<Trans>
									You have uploaded your collection for{" "}
									<PrettyBlizzardAccount
										account={blizzardAccount}
									/>. Hooray!
								</Trans>
								<Trans>
									The deck tracker will now keep your
									collection up to date.
								</Trans>
							</p>
						</section>
						<section id="collection-setup-check-it-out">
							<p className="text-center">
								<a
									href={`/decks/?hearthstone_account=${getAccountKey(
										blizzardAccount,
									)}#maxDustCost=0`}
									className="promo-button-outline"
								>
									{t("Find decks you can build")}
								</a>
							</p>
						</section>
						<Feature feature="delete-collection-debug">
							<section className="text-center">
								<p>
									<a
										href={`#`}
										className="btn btn-danger"
										onClick={() => {
											fetch(
												`/api/v1/collection/?region=${
													blizzardAccount.region
												}&account_lo=${
													blizzardAccount.account_lo
												}`,
												{
													method: "DELETE",
													credentials: "include",
													headers: {
														Accept:
															"application/json",
														"Content-Type":
															"application/json",
														"X-CSRFToken": cookie.get(
															"csrftoken",
														),
													},
												},
											);
										}}
									>
										{t("Remove collection")}
									</a>
								</p>
							</section>
						</Feature>
					</>
				);
			case Step.COLLECTION_DISABLED:
				return (
					<>
						<section id="collection-setup-enable">
							<h2 className="text-center">
								{t("Collection disabled")}
							</h2>
							<p className="text-center">
								{t(
									"You have disabled this feature from your HSReplay.net account settings.",
								)};
							</p>
						</section>
						<section id="collection-setup-check-it-out">
							<p className="text-center">
								<a
									href={"/account/"}
									className="promo-button-outline text-uppercase"
								>
									{t("Account settings")}
								</a>
							</p>
						</section>
					</>
				);
		}
		return null;
	}

	public render(): React.ReactNode {
		const { t } = this.props;
		return (
			<div className="collection-setup-modal">
				<div
					className="modal-banner"
					style={{
						backgroundImage: `url("${image(
							"feature-promotional/collection-syncing-decks.png",
						)}")`,
					}}
				>
					<CloseModalButton />
					{t("Collection uploading")}
				</div>
				<div className="modal-body">
					<section id="collection-setup-about">
						<h1>{t("Find the best decks for your collection!")}</h1>
						<p>
							{t(
								"Upload your Hearthstone collection to enable the following features:",
							)}
						</p>
						<ul className="list-ltr list-ltr-2">
							<li>{t("Find decks you can build right now")}</li>
							<li>{t("See missing cards at a glance")}</li>
							<li>{t("Filter decks by dust cost")}</li>
							<li>{t("Automatic uploading")}</li>
						</ul>
					</section>
					{this.state.step !== Step.COLLECTION_DISABLED ? (
						<section id="collection-setup-progress">
							<span
								id="collection-setup-progress-step"
								className="sr-only"
							>
								{t("Step {step} of {lastStep}", {
									step: this.state.step,
									lastStep: LAST_STEP,
								})}
							</span>
							<ProgressIndicator
								progress={this.state.step}
								total={LAST_STEP}
								aria-labelledby="collection-setup-progress-step"
							/>
						</section>
					) : null}
					{this.renderStep()}
				</div>
			</div>
		);
	}
}
export default translate()(CollectionSetupDialog);
