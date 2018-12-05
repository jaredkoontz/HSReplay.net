import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import UserData from "../UserData";
import Fragments from "../components/Fragments";
import Discover from "../pages/Discover";
import Root from "../components/Root";

const container = document.getElementById("discover-container");
UserData.create();

const render = (cardData: CardData) => {
	ReactDOM.render(
		<Root>
			<Fragments
				defaults={{
					dataset: "live",
					excludedCards: [],
					includedSet: "ALL",
					format: "FT_STANDARD",
					includedCards: [],
					playerClass: "DRUID",
					tab: "decks",
				}}
				immutable={
					!UserData.hasFeature("archetype-training")
						? ["dataset", "format"]
						: null
				}
			>
				<Discover cardData={cardData} latestSet="TROLL" />
			</Fragments>
		</Root>,
		container,
	);
};

render(null);

new CardData().load(render);
