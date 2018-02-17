import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import ArchetypeDetail from "../pages/ArchetypeDetail";
import UserData from "../UserData";
import Fragments from "../components/Fragments";
import ErrorReporter from "../components/ErrorReporter";

const container = document.getElementById("archetype-container");
const archetypeId = container.getAttribute("data-archetype-id");
const archetypeName = container.getAttribute("data-archetype-name");
const playerClass = container.getAttribute("data-archetype-player-class");
const hasStandardData =
	container.getAttribute("data-has-standard-data") === "True";
const hasWildData = container.getAttribute("data-has-wild-data") === "True";

UserData.create();

const render = (cardData: CardData) => {
	ReactDOM.render(
		<ErrorReporter>
			<Fragments
				defaults={{
					rankRange: "LEGEND_THROUGH_TWENTY",
					tab: "overview"
				}}
				immutable={!UserData.isPremium() ? ["rankRange"] : null}
			>
				<ArchetypeDetail
					cardData={cardData}
					archetypeId={+archetypeId}
					archetypeName={archetypeName}
					playerClass={playerClass}
					hasStandardData={hasStandardData}
					hasWildData={hasWildData}
					gameType="RANKED_STANDARD"
				/>
			</Fragments>
		</ErrorReporter>,
		container
	);
};

render(null);

new CardData().load(render);
