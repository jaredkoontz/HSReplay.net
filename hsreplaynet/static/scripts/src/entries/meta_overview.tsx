import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import UserData from "../UserData";
import Fragments from "../components/Fragments";
import MetaOverview from "../pages/MetaOverview";
import Root from "../components/Root";

UserData.create();

const render = (cardData: CardData) => {
	ReactDOM.render(
		<Root>
			<Fragments
				defaults={{
					gameType: "RANKED_STANDARD",
					popularitySortBy: "total",
					popularitySortDirection: "descending",
					rankRange: "LEGEND_THROUGH_TWENTY",
					region: "ALL",
					sortBy: "popularity",
					sortDirection: "descending",
					tab: "tierlist",
					timeFrame: UserData.hasFeature(
						"current-expansion-filter-meta",
					)
						? "CURRENT_EXPANSION"
						: "LAST_7_DAYS",
				}}
				immutable={
					!UserData.isPremium()
						? ["rankRange", "region", "timeFrame"]
						: null
				}
			>
				<MetaOverview cardData={cardData} region="ALL" />
			</Fragments>
		</Root>,
		document.getElementById("meta-overview-container"),
	);
};

render(null);

new CardData().load(render);
