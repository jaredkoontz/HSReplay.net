import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import Decks from "../pages/Decks";
import UserData from "../UserData";
import Fragments from "../components/Fragments";
import ErrorReporter from "../components/ErrorReporter";

const container = document.getElementById("decks-container");
UserData.create();

const render = (cardData: CardData) => {
	ReactDOM.render(
		<ErrorReporter>
			<Fragments
				defaults={{
					archetypes: [],
					archetypeSelector: "",
					excludedCards: [],
					gameType: "RANKED_STANDARD",
					includedCards: [],
					includedSet: "ALL",
					playerClasses: [],
					opponentClasses: [],
					rankRange: "ALL",
					region: "ALL",
					timeRange: UserData.hasFeature("current-patch-filter")
						? "CURRENT_PATCH"
						: UserData.hasFeature("current-expansion-filter")
							? "CURRENT_EXPANSION"
							: "LAST_30_DAYS",
					trainingData: "",
					withStream: false
				}}
				immutable={
					!UserData.isPremium()
						? ["account", "opponentClass", "rankRange", "region"]
						: null
				}
			>
				<Decks
					cardData={cardData}
					latestSet="LOOTAPALOOZA"
					promoteLatestSet={UserData.hasFeature(
						"current-expansion-filter"
					)}
				/>
			</Fragments>
		</ErrorReporter>,
		container
	);
};

render(null);

new CardData().load(render);
