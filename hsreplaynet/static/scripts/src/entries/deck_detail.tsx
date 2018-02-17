import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import DeckDetail from "../pages/DeckDetail";
import UserData from "../UserData";
import Fragments from "../components/Fragments";
import ErrorReporter from "../components/ErrorReporter";

const adminUrl = document
	.getElementById("deck-info")
	.getAttribute("data-admin-url");
const deckId = document
	.getElementById("deck-info")
	.getAttribute("data-deck-id");
const deckName = document
	.getElementById("deck-info")
	.getAttribute("data-deck-name");
const isWild =
	+document.getElementById("deck-info").getAttribute("data-deck-wild") === 1;
const cards = document
	.getElementById("deck-info")
	.getAttribute("data-deck-cards");
const deckClass = document
	.getElementById("deck-info")
	.getAttribute("data-deck-class");
const heroDbfId = +document
	.getElementById("deck-info")
	.getAttribute("data-hero-id");
const archetypeId = document
	.getElementById("deck-info")
	.getAttribute("data-archetype-id");
const archetypeName = document
	.getElementById("deck-info")
	.getAttribute("data-archetype-name");
UserData.create();

const render = (cardData: CardData) => {
	ReactDOM.render(
		<ErrorReporter>
			<Fragments
				defaults={{
					gameType: isWild ? "RANKED_WILD" : "RANKED_STANDARD",
					rankRange: "ALL",
					region: "ALL",
					selectedClasses: [],
					tab: "mulligan-guide"
				}}
				immutable={
					!UserData.isPremium()
						? ["selectedClasses", "rankRange", "region"]
						: null
				}
			>
				<DeckDetail
					adminUrl={adminUrl}
					archetypeId={archetypeId}
					archetypeName={archetypeName}
					cardData={cardData}
					deckCards={cards}
					deckClass={deckClass}
					deckId={deckId}
					deckName={deckName}
					heroDbfId={heroDbfId}
				/>
			</Fragments>
		</ErrorReporter>,
		document.getElementById("deck-container")
	);
};

render(null);

new CardData().load(render);
