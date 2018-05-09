import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import DeckSpotlight from "../pages/DeckSpotlight";
import Root from "../components/Root";
import { Consumer as HearthstoneAccountConsumer } from "../components/utils/hearthstone-account";
import DataInjector from "../components/DataInjector";
import { isCollectionDisabled } from "../utils/collection";

const render = (cardData: CardData) => {
	ReactDOM.render(
		<Root>
			<HearthstoneAccountConsumer>
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
							<DeckSpotlight
								cardData={cardData}
								collection={collection}
							/>
						)}
					</DataInjector>
				)}
			</HearthstoneAccountConsumer>
		</Root>,
		document.getElementById("trending-container"),
	);
};

render(null);

new CardData().load(render);
