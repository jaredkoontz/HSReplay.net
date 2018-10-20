import React from "react";

import CardTable from "./CardTable";
import { storiesOf } from "@storybook/react";
import { action } from "@storybook/addon-actions";

storiesOf("CardTable", module).add("with default", () => {
	const cards = [
		{
			card: {
				id: "CS1_069",
				cost: 5,
				dbfId: 602,
				name: "Fen Creeper",
				rarity: "COMMON",
			},
			count: 1,
		},
		{
			card: {
				id: "UNG_001",
				cost: 3,
				dbfId: 41076,
				name: "Pterrordax Hatchling",
				rarity: "COMMON",
			},
			count: 1,
		},
		{
			card: {
				id: "NEW1_017",
				cost: 1,
				dbfId: 443,
				name: "Hungry Crab",
				rarity: "EPIC",
			},
			count: 1,
		},
		{
			card: {
				id: "ICC_056",
				cost: 2,
				dbfId: 42676,
				name: "Cryostasis",
				rarity: "EPIC",
			},
			count: 1,
		},
		{
			card: {
				id: "UNG_807",
				cost: 2,
				dbfId: 41316,
				name: "Golakka Crawler",
				rarity: "RARE",
			},
			count: 1,
		},
	];

	const prevalence = [
		{
			dbf_id: 602,
			prevalence: 1,
		},
		{
			dbf_id: 41076,
			prevalence: 0.9,
		},
		{
			dbf_id: 443,
			prevalence: 0.8,
		},
		{
			dbf_id: 42676,
			prevalence: 0.7,
		},
		{
			dbf_id: 41316,
			prevalence: 0.6,
		},
	];

	return (
		<CardTable
			cards={cards}
			data={prevalence}
			columns={["prevalence"]}
			numCards={cards.length}
			minColumnWidth={100}
			headerWidth={[150, 300]}
			headerWidthRatio={0.66}
			onSortChanged={action("sortChanged")}
			sortBy={"prevalence"}
			sortDirection={"descending"}
		/>
	);
});
