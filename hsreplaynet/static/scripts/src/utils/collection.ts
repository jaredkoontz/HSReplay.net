import { HearthstoneCollection } from "../interfaces";

export function isMissingCardFromCollection(
	collection: HearthstoneCollection | null,
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
