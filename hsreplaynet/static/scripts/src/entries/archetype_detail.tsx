import React from "react";
import ReactDOM from "react-dom";
import CardData from "../CardData";
import ArchetypeDetail from "../pages/ArchetypeDetail";
import UserData from "../UserData";
import Fragments from "../components/Fragments";
import Root from "../components/Root";
import { Consumer as AccountConsumer } from "../components/utils/hearthstone-account";
import DataInjector from "../components/DataInjector";
import { isCollectionDisabled } from "../utils/collection";

const container = document.getElementById("archetype-container");
const archetypeId = container.getAttribute("data-archetype-id");
const archetypeName = container.getAttribute("data-archetype-name");
const playerClass = container.getAttribute("data-archetype-player-class");
const hasStandardData =
	container.getAttribute("data-has-standard-data") === "True";
const hasWildData = container.getAttribute("data-has-wild-data") === "True";

UserData.create();

const render = (cardData: CardData) => {
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
						fetchCondition={
							UserData.hasFeature("collection-syncing") &&
							!!account &&
							!isCollectionDisabled()
						}
					>
						{({ collection }) => (
							<Fragments
								defaults={{
									rankRange: "LEGEND_THROUGH_TWENTY",
									tab: "overview",
								}}
								immutable={
									!UserData.isPremium() ? ["rankRange"] : null
								}
							>
								<ArchetypeDetail
									cardData={cardData}
									archetypeId={+archetypeId}
									archetypeName={archetypeName}
									playerClass={playerClass}
									hasStandardData={hasStandardData}
									hasWildData={hasWildData}
									gameType="RANKED_STANDARD"
									collection={collection}
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

new CardData().load(render);
