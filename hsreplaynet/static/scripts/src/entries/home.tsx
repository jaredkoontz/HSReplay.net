import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import LiveData from "../components/home/LiveData";
import { winrateData } from "../helpers";

const winrateBoxes = document.getElementsByClassName("box-content");
Array.from(winrateBoxes).forEach(box => {
	const winrate = +box.getAttribute("data-winrate");
	const color = winrateData(50, winrate, 2).color;
	box.setAttribute("style", "color:" + color + ";fill:" + color);
});

const liveData = document.getElementById("live-data");
if (liveData) {
	const render = (cardData: CardData) => {
		ReactDOM.render(
			<LiveData cardData={cardData} numCards={12} />,
			document.getElementById("live-data"),
		);
	};

	render(null);

	new CardData().load(render);
}
