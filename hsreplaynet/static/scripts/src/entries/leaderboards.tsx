import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import UserData from "../UserData";
import DataInjector from "../components/DataInjector";
import Root from "../components/Root";
import Leaderboards from "../pages/Leaderboards";
import Fragments from "../components/Fragments";

UserData.create();

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
								rankRange: "ALL",
								timeRange: "CURRENT_SEASON",
								archetype: "",
								playerClass: "ALL",
								region: "ALL",
								gameType: "RANKED_STANDARD",
								page: 1,
							}}
						>
							<Leaderboards
								cardData={cardData}
								archetypeData={archetypeData}
								pageSize={10}
							/>
						</Fragments>
					);
				}}
			</DataInjector>
		</Root>,
		document.getElementById("leaderboards-container"),
	);
};

render(null);

new CardData().load(render);
