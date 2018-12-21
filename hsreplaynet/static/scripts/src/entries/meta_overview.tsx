import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import UserData from "../UserData";
import Fragments from "../components/Fragments";
import Root from "../components/Root";
import { RankRange, TimeRange } from "../filters";
import MetaOverview from "../pages/MetaOverview";

UserData.create();

const render = (cardData: CardData) => {
	const immutable = [];
	if (!UserData.isPremium()) {
		immutable.push("rankRange", "region");
		if (
			!UserData.hasFeature("current-expansion-filter") &&
			!UserData.hasFeature("current-patch-filter-meta")
		) {
			immutable.push("timeFrame");
		}
	}
	ReactDOM.render(
		<Root>
			<Fragments
				defaults={{
					gameType: "RANKED_STANDARD",
					popularitySortBy: "total",
					popularitySortDirection: "descending",
					rankRange: RankRange.LEGEND_THROUGH_TWENTY,
					region: "ALL",
					sortBy: "popularity",
					sortDirection: "descending",
					tab: "tierlist",
					timeFrame: UserData.hasFeature("current-patch-filter-meta")
						? TimeRange.CURRENT_PATCH
						: UserData.hasFeature("current-expansion-filter")
							? TimeRange.CURRENT_EXPANSION
							: TimeRange.LAST_7_DAYS,
				}}
				immutable={immutable}
			>
				<MetaOverview cardData={cardData} region="ALL" />
			</Fragments>
		</Root>,
		document.getElementById("meta_overview-container"),
	);
};

render(null);

new CardData().load(render);
