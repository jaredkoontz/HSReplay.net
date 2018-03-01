import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import DeckSpotlight from "../pages/DeckSpotlight";
import Root from "../components/Root";

const render = (cardData: CardData) => {
	ReactDOM.render(
		<Root>
			<DeckSpotlight cardData={cardData} />
		</Root>,
		document.getElementById("trending-container"),
	);
};

render(null);

new CardData().load(render);
