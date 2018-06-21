import React from "react";
import DataInjector from "../DataInjector";
import { Account, BlizzardAccount } from "../../utils/api";
import { CollectionEvents } from "../../metrics/GoogleAnalytics";
import { getCollectionParams } from "../../utils/collection";
import DataManager from "../../DataManager";
import UserData from "../../UserData";
import CollectionSetupDialog from "./modal/CollectionSetupDialog";
import { Consumer as BlizzardAccountConsumer } from "../utils/hearthstone-account";
import LoadingSpinner from "../LoadingSpinner";

interface Props {}

interface State {
	hasTokens?: boolean | null;
	hasConnectedHDT: boolean | null;
	blizzardAccount: BlizzardAccount;
	hasMultipleBlizzardAccounts: boolean;
}

export default class CollectionSetup extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			hasConnectedHDT: null,
			hasTokens: null,
			blizzardAccount: null,
			hasMultipleBlizzardAccounts: false,
		};
	}

	private getAccountData = (): void => {
		if (!UserData.isAuthenticated()) {
			return;
		}
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

				let blizzardAccount = null;
				let hasMultipleBlizzardAccounts = false;
				if (
					Array.isArray(account.blizzard_accounts) &&
					account.blizzard_accounts.length > 0
				) {
					blizzardAccount = account.blizzard_accounts[0];
					hasMultipleBlizzardAccounts =
						account.blizzard_accounts.length > 1;
				}

				this.setState(state =>
					Object.assign({}, state, {
						hasConnectedHDT,
						hasTokens,
						hasMultipleBlizzardAccounts,
						blizzardAccount,
					}),
				);
			},
		);
	};

	public componentDidMount(): void {
		this.getAccountData();
		CollectionEvents.onViewModal();
	}

	public render(): React.ReactNode {
		const authenticated = UserData.isAuthenticated();

		if (this.state.hasTokens === null && authenticated) {
			return (
				<div className="collection-setup-modal">
					<div className="modal-body">
						<LoadingSpinner active />
					</div>
				</div>
			);
		}

		return (
			<BlizzardAccountConsumer>
				{({ account }) => {
					const blizzardAccount =
						account || this.state.blizzardAccount;

					return (
						<DataInjector
							query={{
								key: "collection",
								params: blizzardAccount
									? getCollectionParams(blizzardAccount)
									: {},
								url: "/api/v1/collection/",
							}}
							fetchCondition={
								authenticated &&
								this.state.hasConnectedHDT &&
								!!blizzardAccount
							}
						>
							{({ collection, refresh }) => {
								return (
									<CollectionSetupDialog
										isAuthenticated={UserData.isAuthenticated()}
										hasConnectedHDT={
											this.state.hasConnectedHDT
										}
										blizzardAccount={blizzardAccount}
										hasCollection={!!collection}
										hasTokens={this.state.hasTokens}
										hasMultipleBlizzardAccounts={
											this.state
												.hasMultipleBlizzardAccounts
										}
										refreshAccount={this.getAccountData}
										refreshCollection={() =>
											refresh("collection")
										}
									/>
								);
							}}
						</DataInjector>
					);
				}}
			</BlizzardAccountConsumer>
		);
	}
}
