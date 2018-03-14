import React from "react";
import { BlizzardAccount } from "../../utils/api";
import { prettyBlizzardAccount } from "../../utils/account";

interface Props {
	hasConnectedHDT: boolean;
	blizzardAccounts: { [key: string]: BlizzardAccount };
	selectedAccount: string;
	selectAccount: (key: string) => any;
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

interface State {
	step: Step;
	previousStep: Step | null;
}

export default class CollectionSetupAssistant extends React.Component<
	Props,
	State
> {
	private interval: number | null = null;

	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			step: CollectionSetupAssistant.getStep(
				props.hasConnectedHDT,
				props.selectedAccount,
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
			nextProps.selectedAccount !== this.props.selectedAccount ||
			nextProps.hasCollection !== this.props.hasCollection
		) {
			this.setState(state => ({
				step: CollectionSetupAssistant.getStep(
					nextProps.hasConnectedHDT,
					nextProps.selectedAccount,
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
			prevProps.selectedAccount !== this.props.selectedAccount &&
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

	private selectAccount = (event: React.ChangeEvent<HTMLSelectElement>) => {
		this.props.selectAccount(event.target.value);
	};

	private renderAccountChooser(): React.ReactNode {
		const accountKeys = Object.keys(this.props.blizzardAccounts);
		if (accountKeys.length <= 1) {
			return null;
		}
		return (
			<>
				<h2>Select your account</h2>
				<p>
					Please select the Hearthstone account you'd like to upload a
					collection for:
				</p>
				<div className="form-group">
					<select
						value={this.props.selectedAccount}
						onChange={this.selectAccount}
					>
						{Object.keys(this.props.blizzardAccounts).map(key => {
							const account = this.props.blizzardAccounts[key];
							return (
								<option value={key} key={key}>
									{prettyBlizzardAccount(account)}
								</option>
							);
						})}
					</select>
				</div>
				<p>
					You can upload additional collections for your other
					accounts later.
				</p>
			</>
		);
	}

	public render(): React.ReactNode {
		const download = this.props.hasTokens ? (
			<>
				<h2>Download Hearthstone Deck Tracker</h2>
				<p className="text-center">
					Make sure you have the latest version of Hearthstone Deck
					Tracker:
				</p>
				<p className="text-center">
					<a
						href="https://hsdecktracker.net/download/"
						target="_blank"
						className="btn promo-button"
						rel="noopener"
					>
						Download
					</a>
				</p>
			</>
		) : (
			<>
				<h2>Download Hearthstone Deck Tracker</h2>
				<p className="text-center">
					Hearthstone Deck Tracker will upload your collection and
					keep it up to date:
				</p>
				<p className="text-center">
					<a
						href="https://hsdecktracker.net/download/"
						target="_blank"
						className="btn promo-button"
						rel="noopener"
					>
						Download
					</a>
				</p>
			</>
		);
		switch (this.state.step) {
			case Step.CONNECT_HDT:
				return (
					<>
						{download}
						<h2>Setup Instructions</h2>
						<ol>
							<li>
								{this.props.hasTokens
									? "Run the latest version of Hearthstone Deck Tracker"
									: "Download and install Hearthstone Deck Tracker"}
							</li>
							<li>
								Sign in using the <code>HSReplay.net</code> menu
								in your deck tracker
								{this.props.hasTokens ? (
									<>
										<br />
										<span className="text-help">
											Note: You'll need to do this even if
											you've claimed replays in the past
										</span>
									</>
								) : null}
							</li>
						</ol>
						<p className="modal-await">
							<span className="glyphicon glyphicon-repeat glyphicon-spin" />
							Waiting for your deck tracker…
						</p>
					</>
				);
			case Step.CLAIM_ACCOUNT:
				return (
					<>
						{download}
						<h2>Connect to Hearthstone</h2>
						<p>
							Launch Hearthstone while your deck tracker is
							running.
						</p>
						<p className="modal-await">
							<span className="glyphicon glyphicon-repeat glyphicon-spin" />
							Waiting for Hearthstone…
						</p>
					</>
				);
			case Step.UPLOAD_COLLECTION:
				return (
					<>
						{this.renderAccountChooser()}
						<h2>Upload your Collection</h2>
						{this.state.previousStep !== null ? (
							<>
								<p>
									You're nearly there! Enter your collection
									in Hearthstone.
								</p>
								<p className="help-text">
									Note: Make sure the deck tracker is stil
									running.
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
						<p className="modal-await">
							<span className="glyphicon glyphicon-repeat glyphicon-spin" />
							Waiting for your collection…
						</p>
					</>
				);
			default:
			case Step.COMPLETE:
				return (
					<>
						<h2 className="text-center">You're all set!</h2>
						<p className="text-center">
							Go and check out the new features:
						</p>
						<p className="text-center">
							<a href="/decks/" className="promo-button-outline">
								View Decks
							</a>
						</p>
						<p className="text-center">
							Your deck tracker will keep your collection up to
							date.
						</p>
					</>
				);
		}
	}
}
