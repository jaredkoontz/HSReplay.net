import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import UserData from "../UserData";
import Fragments from "../components/Fragments";
import Root from "../components/Root";
import { Consumer as AccountConsumer } from "../components/utils/hearthstone-account";
import { TimeRange } from "../filters";
import Events from "../metrics/Events";
import MyCards from "../pages/MyCards";

const container = document.getElementById("my_cards-container");

UserData.create();
const defaultAccount = UserData.getDefaultAccountKey();

if (!defaultAccount) {
	Events.ga("Pegasus Account", "missing", "My Cards", {
		nonInteraction: true,
	});
}

const render = (cardData: CardData) => {
	ReactDOM.render(
		<Root>
			<AccountConsumer>
				{({ account }) => (
					<Fragments
						defaults={{
							showSparse: false,
							format: "",
							gameType: "RANKED_STANDARD",
							rankRange: "ALL",
							timeRange: UserData.hasFeature(
								"current-patch-filter",
							)
								? TimeRange.CURRENT_PATCH
								: UserData.hasFeature(
										"current-expansion-filter",
								  )
									? TimeRange.CURRENT_EXPANSION
									: TimeRange.LAST_30_DAYS,
							sortBy: "timesPlayed",
							sortDirection: "descending",
							text: "",
							cardClass: [],
							cost: [],
							rarity: [],
							set: [],
							type: [],
							tribe: [],
							mechanics: [],
						}}
						debounce="text"
					>
						<MyCards cardData={cardData} account={account} />
					</Fragments>
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
