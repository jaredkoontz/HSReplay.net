import React from "react";
import DataInjector from "../DataInjector";
import { Account } from "../../utils/api";
import { CollectionEvents } from "../../metrics/GoogleAnalytics";

export default class CollectionSetup extends React.Component {
	public render(): React.ReactNode {
		return (
			<DataInjector query={{ key: "account", url: "/api/v1/account" }}>
				{({ account }: { account: Account }) => {
					if (!account) {
						return (
							<div className="collection-setup-modal">
								Loading...
							</div>
						);
					}
					const {
						blizzard_accounts: blizzardAccounts,
						tokens,
					} = account;
					return (
						<div className="collection-setup-modal">
							<h1>
								Find the decks you can build with your
								collection!
							</h1>
							<p className="text-center">
								<a
									href="https://hsdecktracker.net/download/"
									className="btn promo-button"
								>
									Download Hearthstone Deck Tracker
								</a>
							</p>
						</div>
					);
				}}
			</DataInjector>
		);
	}

	public componentDidMount(): void {
		CollectionEvents.onViewModal();
	}
}
