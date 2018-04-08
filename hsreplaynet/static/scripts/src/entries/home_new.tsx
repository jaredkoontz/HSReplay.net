import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import Root from "../components/Root";
import Home from "../pages/Home";

const container = document.getElementById("home-container");
const render = (cardData: CardData) => {
	ReactDOM.render(
		<Root>
			<Home cardData={cardData} />
		</Root>,
		container,
	);
};

render(null);

new CardData().load(render);
