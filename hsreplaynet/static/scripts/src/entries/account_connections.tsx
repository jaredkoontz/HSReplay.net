import React from "react";
import ReactDOM from "react-dom";
import UserData from "../UserData";
import Root from "../components/Root";
import AccountConnections from "../pages/AccountConnections";

UserData.create();

const e = document.getElementById("account-connections-container");

ReactDOM.render(
	<Root>
		<AccountConnections
			blizzardUrl={e.getAttribute("data-blizzard-url")}
			discordUrl={e.getAttribute("data-discord-url")}
			twitchUrl={e.getAttribute("data-twitch-url")}
		/>
	</Root>,
	e,
);
