import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import UserData from "../UserData";
import Fragments from "../components/Fragments";
import Root from "../components/Root";
import { TimeRange } from "../filters";
import Cards from "../pages/Cards";

const container = document.getElementById("cards-container");

UserData.create();

const render = (cardData: CardData) => {
	ReactDOM.render(
		<Root>
			<Fragments
				defaults={{
					text: "",
					showSparse: false,
					format: "",
					gameType: "RANKED_STANDARD",
					playerClass: "ALL",
					rankRange: "ALL",
					timeRange: UserData.hasFeature("current-patch-filter")
						? TimeRange.CURRENT_PATCH
						: UserData.hasFeature("current-expansion-filter")
							? TimeRange.CURRENT_EXPANSION
							: TimeRange.LAST_14_DAYS,

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
				immutable={UserData.isPremium() ? null : ["rankRange"]}
			>
				<Cards cardData={cardData} />
			</Fragments>
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
