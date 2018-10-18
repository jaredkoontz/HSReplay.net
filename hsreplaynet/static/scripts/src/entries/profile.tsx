import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import UserData from "../UserData";
import DataInjector from "../components/DataInjector";
import Root from "../components/Root";
import Profile from "../pages/Profile";
import Fragments from "../components/Fragments";

UserData.create();

const context = JSON.parse(
	document.getElementById("react_context").textContent,
);

const render = (cardData: CardData) => {
	ReactDOM.render(
		<Root>
			<DataInjector
				query={{
					key: "archetypeData",
					params: {},
					url: "/api/v1/archetypes",
				}}
			>
				{({ archetypeData }) => {
					return (
						<Fragments
							defaults={{
								gameType: "RANKED_STANDARD",
								statsTimeFrame: "CURRENT_SEASON",
							}}
						>
							<Profile
								cardData={cardData}
								archetypeData={archetypeData}
								username={context.username}
								userId={context.user_id}
							/>
						</Fragments>
					);
				}}
			</DataInjector>
		</Root>,
		document.getElementById("profile-container"),
	);
};

render(null);

new CardData().load(render);
