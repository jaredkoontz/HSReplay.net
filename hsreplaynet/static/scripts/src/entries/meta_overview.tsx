import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import UserData from "../UserData";
import Fragments from "../components/Fragments";
import MetaOverview from "../pages/MetaOverview";
import ErrorReporter from "../components/ErrorReporter";

UserData.create();

const render = (cardData: CardData) => {
	ReactDOM.render(
		<ErrorReporter>
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
					timeFrame: "LAST_7_DAYS",
				}}
				immutable={
					!UserData.isPremium()
						? ["rankRange", "region", "timeFrame"]
						: null
				}
			>
				<MetaOverview cardData={cardData} region="ALL" />
			</Fragments>
		</ErrorReporter>,
		document.getElementById("meta-overview-container"),
	);
};

render(null);

new CardData().load(render);
