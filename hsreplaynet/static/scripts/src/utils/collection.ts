import { CardObj } from "../interfaces";
import { getDustCost } from "../helpers";
import { BlizzardAccount, Collection } from "./api";
import { QueryParams } from "../DataManager";
import { cookie } from "cookie_js";

export function getCollectionCardCount(
	collection: Collection | null,
	dbfId: number,
): number | null {
	if (!collection) {
		return null;
	}
	const cards = collection.collection;
	if (!cards) {
		return null;
	}
	const inCollection = cards[dbfId];
	if (!inCollection || !Array.isArray(inCollection)) {
		return 0;
	}
	return +inCollection.reduce((a, b) => a + b, 0);
}

export function isMissingCardFromCollection(
	collection: Collection | null,
	dbfId: number,
	count: number,
): boolean {
	const collectionCount = getCollectionCardCount(collection, dbfId);
	if (collectionCount === null) {
		return false;
	}
	return collectionCount < count;
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
		if (typeof card.dbfId === "undefined") {
			continue;
		}
		const dbfId = card.dbfId;
		let remaining = count;
		const available = Array.isArray(collected[dbfId])
			? collected[dbfId]
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

export function isCollectionDisabled(): boolean {
	return !!cookie.get("disable-collection", false);
}
