import React from "react";
import { BlizzardAccount } from "../../../utils/api";
import ModalAwait from "./ModalAwait";
import DownloadSection from "./DownloadSection";
import { getAccountKey, prettyBlizzardAccount } from "../../../utils/account";
import ProgressIndicator from "./ProgressIndicator";
import CloseModalButton from "../../modal/CloseModalButton";
import LoginButton from "../../account/LoginButton";
import { CollectionEvents } from "../../../metrics/GoogleAnalytics";
import { isCollectionDisabled } from "../../../utils/collection";
import { cookie } from "cookie_js";
import Feature from "../../Feature";

interface Props {
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

export default class CollectionSetupDialog extends React.Component<
	Props,
	State
> {
	private interval: number | null = null;

	constructor(props: Props, context: any) {
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
		const steps = {
			["" + Step.SIGN_IN]: "SIGN_IN",
			["" + Step.CONNECT_HDT]: "CONNECT_HDT",
			["" + Step.CLAIM_ACCOUNT]: "CLAIM_ACCOUNT",
			["" + Step.UPLOAD_COLLECTION]: "UPLOAD_COLLECTION",
			["" + Step.COMPLETE]: "STEP_COMPLETE",
			["" + Step.COLLECTION_DISABLED]: "COLLECTION_DISABLED",
		};
		CollectionEvents.onEnterModalStep(
			steps["" + this.state.step] || "UNKNOWN",
		);
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

		if (step === Step.SIGN_IN) {
			return (
				<>
					<section
						id="collection-setup-sign-in"
						className="text-center"
					>
						<h2>Sign in to get started:</h2>
						<LoginButton
							next={
								document &&
								document.location &&
								document.location.pathname
									? `${
											document.location.pathname
									  }?modal=collection`
									: undefined
							}
						/>
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
							<h2>Setup Instructions</h2>
							<ol>
								<li>
									{this.props.hasTokens
										? "Run the latest version of Hearthstone Deck Tracker"
										: "Download and install Hearthstone Deck Tracker"}
								</li>
								<li>
									Click on the blue HSReplay.net banner at the
									top of your deck tracker
									{this.props.hasTokens ? (
										<>
											<br />
											<span className="text-help">
												Note: You'll need to do this
												even if you've claimed replays
												in the past
											</span>
										</>
									) : null}
								</li>
								<li>
									Make sure you're signed in to HSReplay.net
								</li>
							</ol>
						</section>
						<ModalAwait>Waiting for your deck tracker…</ModalAwait>
					</>
				);
			case Step.CLAIM_ACCOUNT:
				return (
					<>
						<DownloadSection
							hasLegacyClient={this.props.hasTokens}
						/>
						<section id="collection-setup-blizzard-account">
							<h2>Connect to Hearthstone</h2>
							<p>
								Launch Hearthstone while your deck tracker is
								running and enter your collection.
							</p>
						</section>
						<ModalAwait>Waiting for Hearthstone…</ModalAwait>
					</>
				);
			case Step.UPLOAD_COLLECTION:
				return (
					<>
						<section id="collection-setup-upload">
							<h2>Upload your Collection</h2>
							{this.state.previousStep === Step.CLAIM_ACCOUNT ? (
								<>
									<p>
										We found your account{" "}
										<strong>
											{prettyBlizzardAccount(
												this.props.blizzardAccount,
											)}
										</strong>.
									</p>
									<p>
										Now enter your collection in Hearthstone
										to complete the setup.
									</p>
									<p className="text-help">
										Note: Make sure the deck tracker is
										still running.
									</p>
								</>
							) : (
								<>
									<p>There's only a few steps remaining:</p>
									<ol>
										<li>Launch your deck tracker</li>
										<li>Launch Hearthstone</li>
										<li>Enter your collection</li>
									</ol>
									<p className="text-help">
										Make sure you're logged in to Battle.net
										as{" "}
										<strong>
											{prettyBlizzardAccount(
												this.props.blizzardAccount,
											)}
										</strong>.
										{this.props
											.hasMultipleBlizzardAccounts ? (
											<>
												<br />
												Setup another account by
												clicking on your account in the
												top right.
											</>
										) : null}
									</p>
								</>
							)}
						</section>
						<ModalAwait>Waiting for your collection…</ModalAwait>
					</>
				);
			case Step.COMPLETE:
				return (
					<>
						<section id="collection-setup-done">
							<h2 className="text-center">Setup complete!</h2>
							<p className="text-center">
								You have uploaded your collection for{" "}
								<strong>
									{prettyBlizzardAccount(
										this.props.blizzardAccount,
									)}
								</strong>. Hooray!
								<br />
								The deck tracker will now keep your collection
								up to date.
							</p>
						</section>
						<section id="collection-setup-check-it-out">
							<p className="text-center">
								<a
									href={`/decks/?hearthstone_account=${getAccountKey(
										this.props.blizzardAccount,
									)}#maxDustCost=0`}
									className="promo-button-outline"
								>
									See the decks you can build
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
													this.props.blizzardAccount
														.region
												}&account_lo=${
													this.props.blizzardAccount
														.account_lo
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
										Remove collection
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
							<h2 className="text-center">Collection disabled</h2>
							<p className="text-center">
								You have disabled this feature from your
								HSReplay.net account settings.
							</p>
						</section>
						<section id="collection-setup-check-it-out">
							<p className="text-center">
								<a
									href={"/account/"}
									className="promo-button-outline text-uppercase"
								>
									Account settings
								</a>
							</p>
						</section>
					</>
				);
		}
		return null;
	}

	public render(): React.ReactNode {
		return (
			<div className="collection-setup-modal">
				<div
					className="modal-banner"
					style={{
						backgroundImage:
							"url('/static/images/feature-promotional/collection-syncing-decks.png')",
					}}
				>
					<CloseModalButton />
					Collection Uploading
				</div>
				<div className="modal-body">
					<section id="collection-setup-about">
						<h1>Find the best decks for your collection!</h1>
						<p>
							Upload your Hearthstone collection to enable the
							following features:
						</p>
						<ul className="list-ltr list-ltr-2">
							<li>Find decks you can build right now</li>
							<li>See missing cards at a glance</li>
							<li>Filter decks by dust cost</li>
							<li>Automatic uploading</li>
						</ul>
					</section>
					{this.state.step !== Step.COLLECTION_DISABLED ? (
						<section id="collection-setup-progress">
							<span
								id="collection-setup-progress-step"
								className="sr-only"
							>
								Step {this.state.step} of {LAST_STEP}
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
