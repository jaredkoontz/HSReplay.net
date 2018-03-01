import React from "react";
import ReactDOM from "react-dom";
import { cardArt, image } from "../helpers";
import MyReplays from "../pages/MyReplays";
import UserData from "../UserData";
import Fragments from "../components/Fragments";
import CardData from "../CardData";
import Root from "../components/Root";

UserData.create();
let username = UserData.getUsername();

// override username from url if available
const query = location.search;
const parts = query.split("&");
for (const part of parts) {
	const matches = part.match(/\??username=(.*)/);
	if (matches) {
		username = decodeURIComponent(matches[1]);
		break;
	}
}

const render = (cardData: CardData) => {
	ReactDOM.render(
		<Root>
			<Fragments
				defaults={{
					name: "",
					mode: "",
					format: "",
					result: "",
					hero: "ALL",
					opponent: "ALL",
				}}
				debounce={"name"}
			>
				<MyReplays
					image={image}
					cardArt={cardArt}
					cardData={cardData}
					username={username}
				/>
			</Fragments>
		</Root>,
		document.getElementById("my-games-container"),
	);
};

render(null);

new CardData().load(render);
