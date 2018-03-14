import React from "react";
import DataInjector from "../DataInjector";
import { Account, BlizzardAccount } from "../../utils/api";
import { CollectionEvents } from "../../metrics/GoogleAnalytics";
import CollectionSetupAssistant from "./CollectionSetupAssistant";
import { getAccountKey } from "../../utils/account";
import { getCollectionParams } from "../../utils/collection";
import DataManager from "../../DataManager";
import UserData from "../../UserData";

interface Props {}

interface State {
	hasTokens?: boolean | null;
	hasConnectedHDT: boolean | null;
	blizzardAccounts: { [key: string]: BlizzardAccount } | null;
	blizzardAccountKey: string | null;
}

export default class CollectionSetup extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			hasConnectedHDT: null,
			hasTokens: null,
			blizzardAccounts: null,
			blizzardAccountKey: UserData.getDefaultAccountKey(),
		};
	}

	private getAccountData = (): void => {
		DataManager.get("/api/v1/account/", {}, true).then(
			(account: Account) => {
				const hasConnectedHDT =
					typeof account._has_connected_hdt !== "undefined"
						? !!account._has_connected_hdt
						: true;
				const hasTokens =
					account.tokens &&
					Array.isArray(account.tokens) &&
					account.tokens.length > 0;

				const blizzardAccounts = {};
				if (Array.isArray(account.blizzard_accounts)) {
					for (const currentAccount of account.blizzard_accounts) {
						blizzardAccounts[
							getAccountKey(currentAccount)
						] = currentAccount;
					}
				}

				this.setState(state => {
					let blizzardAccountKey = state.blizzardAccountKey;
					if (
						blizzardAccountKey === null ||
						!blizzardAccounts[blizzardAccountKey]
					) {
						if (
							Array.isArray(account.blizzard_accounts) &&
							account.blizzard_accounts.length > 0
						) {
							blizzardAccountKey = getAccountKey(
								account.blizzard_accounts[0],
							);
						}
					}
					return Object.assign({}, state, {
						hasConnectedHDT,
						hasTokens,
						blizzardAccountKey,
						blizzardAccounts,
					});
				});
			},
		);
	};

	public componentDidMount(): void {
		this.getAccountData();
		CollectionEvents.onViewModal();
	}

	public render(): React.ReactNode {
		if (this.state.hasTokens === null) {
			return (
				<div className="collection-setup-modal">
					<div className="modal-body">Loading…</div>
				</div>
			);
		}

		const blizzardAccount = this.state.blizzardAccounts[
			this.state.blizzardAccountKey
		];

		return (
			<DataInjector
				query={{
					key: "collection",
					params: blizzardAccount
						? getCollectionParams(blizzardAccount)
						: {},
					url: "/api/v1/collection/",
				}}
				fetchCondition={this.state.hasConnectedHDT && !!blizzardAccount}
			>
				{({ collection, refresh }) => {
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
								<h1>
									Find the best decks for your collection!
								</h1>
								<p>
									Upload your Hearthstone collection to enable
									the following features:
								</p>
								<ul className="list-ltr list-ltr-2">
									<li>Find decks you can build right now</li>
									<li>See missing cards at a glance</li>
									<li>Filter decks by dust cost</li>
									<li>Automatic updates</li>
								</ul>
								<CollectionSetupAssistant
									hasConnectedHDT={this.state.hasConnectedHDT}
									blizzardAccounts={
										this.state.blizzardAccounts
									}
									selectedAccount={
										this.state.blizzardAccountKey
									}
									selectAccount={k =>
										this.setState({
											blizzardAccountKey: k,
										})
									}
									hasCollection={!!collection}
									hasTokens={this.state.hasTokens}
									refreshAccount={this.getAccountData}
									refreshCollection={() =>
										refresh("collection")
									}
								/>
							</div>
						</div>
					);
				}}
			</DataInjector>
		);
	}
}
