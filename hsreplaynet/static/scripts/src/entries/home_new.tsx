import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import Root from "../components/Root";
import Home from "../pages/Home";
import UserData from "../UserData";

const container = document.getElementById("home-container");
UserData.create();

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
