import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import Decks from "../pages/Decks";
import UserData from "../UserData";
import Fragments from "../components/Fragments";
import { Consumer as HearthstoneAccountConsumer } from "../components/utils/hearthstone-account";
import DataInjector from "../components/DataInjector";
import Root from "../components/Root";
import { isCollectionDisabled } from "../utils/collection";
import { TimeRange } from "../filters";

const container = document.getElementById("decks-container");
UserData.create();

const render = (cardData: CardData) => {
	ReactDOM.render(
		<Root>
			<HearthstoneAccountConsumer>
				{({ account }) => (
					<DataInjector
						query={{
							key: "collection",
							params: {
								region: "" + (account && account.region),
								account_lo: "" + (account && account.lo),
							},
							url: "/api/v1/collection/",
						}}
						fetchCondition={!!account && !isCollectionDisabled()}
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
									minGames: 400,
									opponentClasses: [],
									playerClasses: [],
									pilotExperience: "ALL",
									rankRange: "ALL",
									region: "ALL",
									timeRange: UserData.hasFeature(
										"current-patch-filter",
									)
										? TimeRange.CURRENT_PATCH
										: UserData.hasFeature(
												"current-expansion-filter",
										  )
											? TimeRange.CURRENT_EXPANSION
											: TimeRange.LAST_30_DAYS,
									trainingData: "",
									withStream: false,
									wildCard: false,
								}}
								immutable={
									!UserData.isPremium()
										? [
												"account",
												"opponentClass",
												"rankRange",
												"region",
												"pilotExperience",
										  ]
										: null
								}
							>
								<Decks
									cardData={cardData}
									collection={collection}
									latestSet="TROLL"
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
