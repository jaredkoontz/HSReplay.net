import { CardObj } from "../interfaces";
import { getDustCost } from "../helpers";
import { BlizzardAccount, Collection } from "./api";
import { QueryParams } from "../DataManager";

export function isMissingCardFromCollection(
	collection: Collection | null,
	dbfId: number,
	count: number,
): boolean {
	if (!collection) {
		return false;
	}
	const cards = collection.collection;
	if (!cards) {
		return false;
	}
	const inCollection = cards[dbfId];
	if (!Array.isArray(inCollection)) {
		return false;
	}
	const available = inCollection.reduce((a, b) => a + b, 0);
	return available < count;
}

export function getDustCostForCollection(
	collection: Collection | null,
	cards: CardObj[],
): number {
	if (!collection || !collection.collection) {
		return getDustCost(cards);
	}

	const collected = collection.collection;

	let dustCost = 0;
	for (const cardObj of cards) {
		const { card, count } = cardObj;
		let remaining = count;
		const available = Array.isArray(collected[card.dbfId])
			? collected[card.dbfId]
			: [0];
		remaining -= available.reduce((a, b) => a + b, 0);
		if (remaining > 0) {
			dustCost += getDustCost(card) * remaining;
		}
	}

	return dustCost;
}

export function getCollectionParams(
	blizzardAccount: BlizzardAccount,
): QueryParams {
	if (!blizzardAccount) {
		return {};
	}
	return {
		region: "" + blizzardAccount.region,
		account_lo: "" + blizzardAccount.account_lo,
	};
}
