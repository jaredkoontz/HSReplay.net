import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import DeckSpotlight from "../pages/DeckSpotlight";
import ErrorReporter from "../components/ErrorReporter";

const render = (cardData: CardData) => {
	ReactDOM.render(
		<ErrorReporter>
			<DeckSpotlight cardData={cardData} />
		</ErrorReporter>,
		document.getElementById("trending-container")
	);
};

render(null);

new CardData().load(render);
