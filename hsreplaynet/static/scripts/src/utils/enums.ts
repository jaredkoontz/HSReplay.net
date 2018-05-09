import { CardClass } from "../hearthstone";

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
