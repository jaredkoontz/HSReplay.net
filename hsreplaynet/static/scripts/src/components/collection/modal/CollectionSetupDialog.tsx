import React from "react";
import { BlizzardAccount } from "../../../utils/api";
import ModalAwait from "./ModalAwait";
import BlizzardAccountChooser from "./BlizzardAccountChooser";
import DownloadSection from "./DownloadSection";
import { getAccountKey, prettyBlizzardAccount } from "../../../utils/account";
import ProgressIndicator from "./ProgressIndicator";

interface Props {
	hasConnectedHDT: boolean;
	blizzardAccounts: { [key: string]: BlizzardAccount };
	blizzardAccount: string;
	setBlizzardAccount: (key: string) => any;
	hasCollection: boolean;
	hasTokens: boolean;
	refreshAccount: () => any;
	refreshCollection: () => any;
}

const enum Step {
	CONNECT_HDT = 1,
	CLAIM_ACCOUNT = 2,
	UPLOAD_COLLECTION = 3,
	COMPLETE = 4,
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
				props.hasConnectedHDT,
				props.blizzardAccount,
				props.hasCollection,
			),
			previousStep: null,
		};
	}

	private static getStep(
		hasConnectedHDT: boolean,
		selectedAccount: string | null,
		hasCollection: boolean,
	): Step {
		if (!hasConnectedHDT) {
			return Step.CONNECT_HDT;
		}
		if (selectedAccount === null) {
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
			nextProps.hasConnectedHDT !== this.props.hasConnectedHDT ||
			nextProps.blizzardAccount !== this.props.blizzardAccount ||
			nextProps.hasCollection !== this.props.hasCollection
		) {
			this.setState(state => ({
				step: CollectionSetupDialog.getStep(
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
	}

	public componentWillUnmount(): void {
		this.clearInterval();
		document.removeEventListener("visibilitychange", this.visibilityChange);
	}

	private renderStep(): React.ReactNode {
		const selectedAccount =
			this.props.blizzardAccounts !== null &&
			this.props.blizzardAccount !== null
				? this.props.blizzardAccounts[this.props.blizzardAccount]
				: null;
		const hasMultipleBlizzardAccounts = Object.keys(
			this.props.blizzardAccounts,
		);

		switch (this.state.step) {
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
									Sign in using the <code>HSReplay.net</code>{" "}
									menu in your deck tracker
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
							</ol>
						</section>
						<ModalAwait>your deck tracker</ModalAwait>
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
								running.
							</p>
						</section>
						<ModalAwait>Hearthstone</ModalAwait>
					</>
				);
			case Step.UPLOAD_COLLECTION:
				return (
					<>
						<BlizzardAccountChooser
							accounts={this.props.blizzardAccounts}
							account={this.props.blizzardAccount}
							setAccount={this.props.setBlizzardAccount}
							note={
								<>
									You can set up the collections from your
									other accounts later.
								</>
							}
						/>
						<section id="collection-setup-upload">
							<h2>Upload your Collection</h2>
							{2 == 1 + 1 ? (
								<>
									<p>
										You're nearly there! Enter your
										collection in Hearthstone.
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
								</>
							)}
						</section>
						<ModalAwait>your collection</ModalAwait>
					</>
				);
			case Step.COMPLETE:
				return (
					<>
						<BlizzardAccountChooser
							accounts={this.props.blizzardAccounts}
							account={this.props.blizzardAccount}
							setAccount={this.props.setBlizzardAccount}
							note={
								<>
									You can now select another account to set it
									up.
								</>
							}
						/>
						<section id="collection-setup-done">
							<h2 className="text-left">Collection received!</h2>
							<p>
								{hasMultipleBlizzardAccounts &&
								selectedAccount ? (
									<>
										You have uploaded the collection for{" "}
										<strong>
											{prettyBlizzardAccount(
												selectedAccount,
											)}
										</strong>.
									</>
								) : (
									<>
										You have uploaded your collection.
										Hooray!
									</>
								)}
								<br />
								The deck tracker will now keep your collection
								up to date.
							</p>
						</section>
						<section id="collection-setup-check-it-out">
							<p className="text-center">
								<span>Try it out:</span>
								<a
									href={`/decks/?hearthstone_account=${getAccountKey(
										selectedAccount,
									)}`}
									className="promo-button-outline"
								>
									View Decks
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
							<li>Automatic updates</li>
						</ul>
					</section>
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
					{this.renderStep()}
				</div>
			</div>
		);
	}
}
