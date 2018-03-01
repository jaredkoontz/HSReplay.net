import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import CardDetail from "../pages/CardDetail";
import UserData from "../UserData";
import Fragments from "../components/Fragments";
import Root from "../components/Root";

const cardId = document
	.getElementById("card-info")
	.getAttribute("data-card-id");
const dbfId = +document.getElementById("card-info").getAttribute("data-dbf-id");
UserData.create();

const render = (cardData: CardData) => {
	const card = cardData && cardData.fromDbf(dbfId);
	ReactDOM.render(
		<Root>
			<Fragments
				defaults={{
					gameType: "RANKED_STANDARD",
					opponentClass: "ALL",
					rankRange: "ALL",
				}}
				immutable={
					!UserData.isPremium()
						? ["opponentClass", "rankRange"]
						: null
				}
			>
				<CardDetail
					card={card}
					cardData={cardData}
					cardId={cardId}
					dbfId={dbfId}
				/>
			</Fragments>
		</Root>,
		document.getElementById("card-container"),
	);
};

render(null);

new CardData().load(render);
