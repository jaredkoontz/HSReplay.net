import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import Root from "../components/Root";
import Home from "../pages/Home";
import UserData from "../UserData";

const container = document.getElementById("home-container");
const query = window.location.search;
const streamerParam = "?promoted_streamer=";
const promotedStreamer = query.startsWith(streamerParam)
	? query.slice(streamerParam.length)
	: container.getAttribute("data-promoted-streamer");
UserData.create();

const render = (cardData: CardData) => {
	ReactDOM.render(
		<Root>
			<Home cardData={cardData} promotedStreamer={promotedStreamer} />
		</Root>,
		container,
	);
};

render(null);

new CardData().load(render);
