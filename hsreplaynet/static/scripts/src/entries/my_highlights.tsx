import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import MyHighlights from "../pages/MyHighlights";
import UserData from "../UserData";

UserData.create();

const render = (cardData: CardData) => {
	ReactDOM.render(
		<MyHighlights cardData={cardData} />,
		document.getElementById("my-highlights-container"),
	);
};

render(null);

new CardData().load(render);
