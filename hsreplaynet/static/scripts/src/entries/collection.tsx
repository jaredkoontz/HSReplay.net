import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import UserData from "../UserData";
import Fragments from "../components/Fragments";
import Root from "../components/Root";
import Collection from "../pages/Collection";
import DataInjector from "../components/DataInjector";
import { Consumer as AccountConsumer } from "../components/utils/hearthstone-account";

const container = document.getElementById("collection-container");

UserData.create();
const context = JSON.parse(
	document.getElementById("react_context").textContent,
);

const render = (cardData: CardData) => {
	ReactDOM.render(
		<Root>
			<AccountConsumer>
				{({ account }) => (
					<DataInjector
						query={{
							url: "/api/v1/collection/",
							key: "collection",
							params: {
								region: context.owner
									? account && account.region
									: context.region,
								account_lo: context.owner
									? account && account.account_lo
									: context.account_lo,
							},
						}}
						fetchCondition={
							context && !context.owner
								? context.region && context.account_lo
								: account &&
								  account.region &&
								  account.account_lo
						}
					>
						{({ collection, status }) => (
							<Fragments
								defaults={{
									playerClass: [],
									golden: [],
									cost: [],
									rarity: [],
									set: [],
									type: [],
									tribe: [],
									mechanics: [],
									text: "",
								}}
								debounce="text"
							>
								<Collection
									cardData={cardData}
									battleTag={context.battletag}
									visibility={context.visibility}
									account={account}
									collection={collection}
									collectionLoadingStatus={status}
									owner={context.owner}
								/>
							</Fragments>
						)}
					</DataInjector>
				)}
			</AccountConsumer>
		</Root>,
		container,
	);
};

render(null);

const addMechanics = (c: any) => {
	const add = (card: any, mechanic: string) => {
		if (!card.mechanics) {
			card.mechanics = [];
		}
		if (card.mechanics.indexOf(mechanic) === -1) {
			card.mechanics.push(mechanic);
		}
	};
	if (c.referencedTags) {
		c.referencedTags.forEach(tag => add(c, tag));
	}
};

new CardData(addMechanics).load(render);
