import { CardClass, Rarity } from "../hearthstone";

export function getCardClass(cardClass: string | CardClass): CardClass {
	if (typeof cardClass !== "string") {
		return cardClass;
	}
	switch (cardClass.toUpperCase()) {
		case "DEATHKNIGHT":
			return CardClass.DEATHKNIGHT;
		case "DRUID":
			return CardClass.DRUID;
		case "HUNTER":
			return CardClass.HUNTER;
		case "MAGE":
			return CardClass.MAGE;
		case "PALADIN":
			return CardClass.PALADIN;
		case "PRIEST":
			return CardClass.PRIEST;
		case "ROGUE":
			return CardClass.ROGUE;
		case "SHAMAN":
			return CardClass.SHAMAN;
		case "WARLOCK":
			return CardClass.WARLOCK;
		case "WARRIOR":
			return CardClass.WARRIOR;
		case "NEUTRAL":
			return CardClass.NEUTRAL;
		case "DREAM":
			return CardClass.DREAM;
		default:
			return CardClass.INVALID;
	}
}

export function getRarity(rarity: string | Rarity): Rarity {
	if (typeof rarity !== "string") {
		return rarity;
	}
	switch (rarity.toUpperCase()) {
		case "COMMON":
			return Rarity.COMMON;
		case "RARE":
			return Rarity.RARE;
		case "EPIC":
			return Rarity.EPIC;
		case "LEGENDARY":
			return Rarity.LEGENDARY;
		case "FREE":
			return Rarity.FREE;
		default:
			return Rarity.INVALID;
	}
}
