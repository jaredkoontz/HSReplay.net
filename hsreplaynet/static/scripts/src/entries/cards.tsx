import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import UserData from "../UserData";
import DataInjector from "../components/DataInjector";
import Fragments from "../components/Fragments";
import Root from "../components/Root";
import { Consumer as AccountConsumer } from "../components/utils/hearthstone-account";
import GoogleAnalytics from "../metrics/GoogleAnalytics";
import Cards from "../pages/Cards";
import { isCollectionDisabled } from "../utils/collection";

const container = document.getElementById("card-container");
const personal = container.getAttribute("data-view-type") === "personal";

UserData.create();
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
						fetchCondition={!!account && !isCollectionDisabled()}
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
									tribe: [],
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

const addMechanics = (c: any) => {
	const add = (card: any, mechanic: string) => {
		if (!card.mechanics) {
			card.mechanics = [];
		}
		if (card.mechanics.indexOf(mechanic) === -1) {
			card.mechanics.push(mechanic);
		}
	};
	if (c.referencedTags) {
		c.referencedTags.forEach(tag => add(c, tag));
	}
};

new CardData(addMechanics).load(render);
