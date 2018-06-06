import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import UserData from "../UserData";
import DataInjector from "../components/DataInjector";
import Fragments from "../components/Fragments";
import Root from "../components/Root";
import { Consumer as AccountConsumer } from "../components/utils/hearthstone-account";
import CardDetail from "../pages/CardDetail";
import { isCollectionDisabled } from "../utils/collection";

UserData.create();
const context = JSON.parse(
	document.getElementById("react_context").textContent,
);

const render = (cardData: CardData) => {
	const card = cardData && cardData.fromDbf(context["dbf_id"]);
	ReactDOM.render(
		<Root>
			<AccountConsumer>
				{({ account }) => (
					<DataInjector
						query={{
							key: "collection",
							params: {
								region: "" + (account && account.region),
								account_lo: "" + (account && account.lo),
							},
							url: "/api/v1/collection/",
						}}
						fetchCondition={!!account && !isCollectionDisabled()}
					>
						{({ collection }) => (
							<Fragments
								defaults={{
									gameType: "RANKED_STANDARD",
									opponentClass: "ALL",
									rankRange: "ALL",
									tab: "recommended-decks",
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
									cardId={context["card_id"]}
									dbfId={context["dbf_id"]}
									collection={collection}
								/>
							</Fragments>
						)}
					</DataInjector>
				)}
			</AccountConsumer>
		</Root>,
		document.getElementById("card_detail-container"),
	);
};

render(null);

new CardData().load(render);
