import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import UserData from "../UserData";
import Root from "../components/Root";
import Leaderboards from "../pages/Leaderboards";
import Fragments from "../components/Fragments";

UserData.create();

const render = (cardData: CardData) => {
	ReactDOM.render(
		<Root>
			<Fragments
				defaults={{
					rankRange: "ALL",
					timeRange: "CURRENT_SEASON",
					playerClass: "ALL",
					region: "ALL",
					gameType: "RANKED_STANDARD",
					page: 1,
				}}
			>
				<Leaderboards cardData={cardData} pageSize={10} />
			</Fragments>
		</Root>,
		document.getElementById("leaderboards-container"),
	);
};

render(null);

new CardData().load(render);
