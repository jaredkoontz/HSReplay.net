import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import Cards from "../pages/Cards";
import UserData from "../UserData";
import Fragments from "../components/Fragments";
import GoogleAnalytics from "../metrics/GoogleAnalytics";
import Root from "../components/Root";
import { Consumer as AccountConsumer } from "../components/utils/hearthstone-account";
import DataInjector from "../components/DataInjector";
import { isCollectionDisabled } from "../utils/collection";

const container = document.getElementById("card-container");
const personal = container.getAttribute("data-view-type") === "personal";

UserData.create();
const availableAccounts = UserData.getAccounts();
const defaultAccount = UserData.getDefaultAccountKey();

if (personal && !defaultAccount) {
	GoogleAnalytics.event("Pegasus Account", "missing", "My Cards", {
		nonInteraction: true,
	});
}

const render = (cardData: CardData) => {
	ReactDOM.render(
		<Root>
			<AccountConsumer>
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
						fetchCondition={
							UserData.hasFeature("collection-syncing") &&
							!!account &&
							!isCollectionDisabled()
						}
					>
						{({ collection }) => (
							<Fragments
								defaults={{
									text: "",
									showSparse: false,
									format: "",
									gameType: "RANKED_STANDARD",
									playerClass: "ALL",
									rankRange: "ALL",
									timeRange: personal
										? "LAST_30_DAYS"
										: UserData.hasFeature(
												"current-patch-filter",
										  )
											? "CURRENT_PATCH"
											: UserData.hasFeature(
													"current-expansion-filter",
											  )
												? "CURRENT_EXPANSION"
												: "LAST_14_DAYS",

									exclude: "",
									cost: [],
									rarity: [],
									set: [],
									type: [],
									race: [],
									mechanics: [],
									sortBy: "timesPlayed",
									sortDirection: "descending",
									display: "statistics",
									uncollectible: "",
								}}
								debounce="text"
								immutable={
									UserData.isPremium() ? null : ["rankRange"]
								}
							>
								<Cards
									cardData={cardData}
									personal={personal}
									account={account}
									collection={collection}
								/>
							</Fragments>
						)}
					</DataInjector>
				)}
			</AccountConsumer>
		</Root>,
		container,
	);
};

render(null);

const addMechanics = (card: any) => {
	const add = (card: any, mechanic: string) => {
		if (!card.mechanics) {
			card.mechanics = [];
		}
		if (card.mechanics.indexOf(mechanic) === -1) {
			card.mechanics.push(mechanic);
		}
	};
	if (card.referencedTags) {
		card.referencedTags.forEach(tag => add(card, tag));
	}
};

new CardData(addMechanics).load(render);
