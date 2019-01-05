import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import UserData from "../UserData";
import Fragments from "../components/Fragments";
import Root from "../components/Root";
import { Consumer as AccountConsumer } from "../components/utils/hearthstone-account";
import { TimeRange } from "../filters";
import MyDecks from "../pages/MyDecks";

const container = document.getElementById("my_decks-container");
UserData.create();

const render = (cardData: CardData) => {
	ReactDOM.render(
		<Root>
			<AccountConsumer>
				{({ account }) => (
					<Fragments
						defaults={{
							excludedCards: [],
							gameType: "RANKED_STANDARD",
							includedCards: [],
							includedSet: "ALL",
							timeRange: UserData.hasFeature(
								"current-patch-filter",
							)
								? TimeRange.CURRENT_PATCH
								: UserData.hasFeature(
										"current-expansion-filter",
								  )
									? TimeRange.CURRENT_EXPANSION
									: TimeRange.LAST_30_DAYS,
							playerClasses: [],
						}}
					>
						<MyDecks cardData={cardData} account={account} />
					</Fragments>
				)}
			</AccountConsumer>
		</Root>,
		container,
	);
};

render(null);

new CardData().load(render);
