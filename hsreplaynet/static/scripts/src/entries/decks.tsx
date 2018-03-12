import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import Decks from "../pages/Decks";
import UserData, { Account } from "../UserData";
import Fragments from "../components/Fragments";
import { Consumer as HearthstoneAccountConsumer } from "../components/utils/hearthstone-account";
import DataInjector from "../components/DataInjector";
import Root from "../components/Root";
import { cookie } from "cookie_js";

const container = document.getElementById("decks-container");
UserData.create();

const render = (cardData: CardData) => {
	ReactDOM.render(
		<Root>
			<HearthstoneAccountConsumer>
				{(account: Account) => (
					<DataInjector
						query={{
							key: "collection",
							params: {
								account_hi: "" + (account && account.hi),
								account_lo: "" + (account && account.lo),
							},
							url: "/api/v1/collection/",
						}}
						fetchCondition={
							UserData.hasFeature("collection-syncing") &&
							!!account &&
							!cookie.get("disable-collection", false)
						}
					>
						{({ collection }) => (
							<Fragments
								defaults={{
									archetypeSelector: "",
									archetypes: [],
									excludedCards: [],
									gameType: "RANKED_STANDARD",
									includedCards: [],
									includedSet: "ALL",
									maxDustCost: -1,
									opponentClasses: [],
									playerClasses: [],
									rankRange: "ALL",
									region: "ALL",
									timeRange: UserData.hasFeature(
										"current-patch-filter",
									)
										? "CURRENT_PATCH"
										: UserData.hasFeature(
												"current-expansion-filter",
										  )
											? "CURRENT_EXPANSION"
											: "LAST_30_DAYS",
									trainingData: "",
									withStream: false,
								}}
								immutable={
									!UserData.isPremium()
										? [
												"account",
												"opponentClass",
												"rankRange",
												"region",
										  ]
										: null
								}
							>
								<Decks
									cardData={cardData}
									collection={collection}
									latestSet="LOOTAPALOOZA"
									promoteLatestSet={UserData.hasFeature(
										"current-expansion-filter",
									)}
								/>
							</Fragments>
						)}
					</DataInjector>
				)}
			</HearthstoneAccountConsumer>
		</Root>,
		container,
	);
};

render(null);

let myCardData = null;

new CardData().load(cardData => {
	myCardData = cardData;
	render(myCardData);
});
