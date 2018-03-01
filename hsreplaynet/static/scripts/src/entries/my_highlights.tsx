import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import MyHighlights from "../pages/MyHighlights";
import UserData from "../UserData";
import Root from "../components/Root";

UserData.create();

const render = (cardData: CardData) => {
	ReactDOM.render(
		<Root>
			<MyHighlights cardData={cardData} />
		</Root>,
		document.getElementById("my-highlights-container"),
	);
};

render(null);

new CardData().load(render);
