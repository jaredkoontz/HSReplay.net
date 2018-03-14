import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import LiveData from "../components/home/LiveData";
import { winrateData } from "../helpers";
import Modal from "../components/Modal";
import CollectionSetup from "../components/collection/CollectionSetup";

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

const banner = document.getElementById("collection-syncing-banner");
if (banner) {
	const modalDummy = document.createElement("div");
	modalDummy.setAttribute("id", "modal-dummy");
	banner.parentNode.appendChild(modalDummy);
	banner.addEventListener("click", () => {
		ReactDOM.render(
			<Modal
				onClose={() => {
					ReactDOM.unmountComponentAtNode(modalDummy);
				}}
			>
				<CollectionSetup />
			</Modal>,
			modalDummy,
		);
	});
}
