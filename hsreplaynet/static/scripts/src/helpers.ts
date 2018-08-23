/// <reference path="./global.d.ts" />
import React from "react";
import CardData from "./CardData";
import { Colors } from "./Colors";
import Fragments from "./components/Fragments";
import { wildSets } from "./constants";
import { CardClass, Rarity } from "./hearthstone";
import {
	CardObj,
	ChartMetaData,
	ChartScheme,
	ChartSchemeType,
	ChartSeries,
	DataPoint,
	GlobalGamePlayer,
} from "./interfaces";
import { Archetype } from "./utils/api";
import { getCardClass, getRarity } from "./utils/enums";
import { CardData as HearthstoneJSONCardData } from "hearthstonejson-client";
import { TranslationFunction } from "react-i18next";
import { formatNumber } from "./i18n";

export function staticFile(file: string) {
	return STATIC_URL + file;
}

export function joustStaticFile(file: string) {
	return JOUST_STATIC_URL + file;
}

export function image(filename: string) {
	return staticFile(`images/${filename}`);
}

export function joustAsset(asset: string) {
	return joustStaticFile("assets/" + asset);
}

export function cardArt(filename: string) {
	return `${HEARTHSTONE_ART_URL}/256x/${filename}.jpg`;
}

export function capitalize(str: string) {
	return (
		str && str.substr(0, 1).toUpperCase() + str.substr(1, str.length - 1)
	);
}

export function toTitleCase(str: string) {
	return (
		str &&
		str.substr(0, 1).toUpperCase() +
			str.substr(1, str.length - 1).toLowerCase()
	);
}

export function getHeroColor(cardClass: CardClass | string): string {
	if (!cardClass) {
		return;
	}
	switch (getCardClass(cardClass)) {
		case CardClass.DRUID:
			return "#FF7D0A";
		case CardClass.HUNTER:
			return "#ABD473";
		case CardClass.MAGE:
			return "#69CCF0";
		case CardClass.PALADIN:
			return "#F58CBA";
		case CardClass.PRIEST:
			return "#D2D2D2";
		case CardClass.ROGUE:
			return "#FFF01a";
		case CardClass.SHAMAN:
			return "#0070DE";
		case CardClass.WARLOCK:
			return "#9482C9";
		case CardClass.WARRIOR:
			return "#C79C6E";
		default:
			return "#808080";
	}
}

export function getChartScheme(
	theme: ChartSchemeType,
	t: TranslationFunction,
): ChartScheme {
	let scheme: ChartScheme = null;
	switch (theme) {
		case "rarity":
			scheme = getRarityScheme(t);
			break;
		case "cardtype":
			scheme = getCardtypeScheme(t);
			break;
		case "cost":
			scheme = costScheme;
			break;
		case "class":
			scheme = getClassColorScheme(t);
			break;
	}
	return Object.assign(
		{},
		{
			other: {
				fill: "rgb(140, 140, 140)",
				stroke: "rgb(140, 140, 140)",
			},
		},
		scheme,
	);
}

const costScheme: ChartScheme = {
	0: {
		fill: "rgba(204, 204, 255, 0.5)",
		stroke: "rgba(204, 204, 255, 0.9)",
	},
	1: {
		fill: "rgba(153, 153, 255, 0.5)",
		stroke: "rgba(153, 153, 255, 0.9)",
	},
	2: {
		fill: "rgba(102, 102, 255, 0.5)",
		stroke: "rgba(102, 102, 255, 0.9)",
	},
	3: {
		fill: "rgba(51, 51, 255, 0.5)",
		stroke: "rgba(51, 51, 255, 0.9)",
	},
	4: {
		fill: "rgba(0, 0, 255, 0.5)",
		stroke: "rgba(0, 0, 255, 0.9)",
	},
	5: {
		fill: "rgba(0, 0, 204, 0.5)",
		stroke: "rgba(0, 0, 204, 0.9)",
	},
	6: {
		fill: "rgba(0, 0, 153, 0.5)",
		stroke: "rgba(0, 0, 153, 0.9)",
	},
	7: {
		fill: "rgba(0, 0, 102, 0.5)",
		stroke: "rgba(0, 0, 102, 0.9)",
		name: "7+",
	},
};

function getRarityScheme(t: TranslationFunction): ChartScheme {
	return {
		free: {
			fill: "rgba(211, 211, 211, 0.5)",
			stroke: "rgba(211, 211, 211, 0.9)",
			name: t("GLOBAL_RARITY_FREE"),
		},
		common: {
			fill: "rgba(169, 169, 169, 0.5)",
			stroke: "rgba(169, 169, 169, 0.9)",
			name: t("GLOBAL_RARITY_COMMON"),
		},
		rare: {
			fill: "rgba(0, 112, 221, 0.5)",
			stroke: "rgba(0, 112, 221, 0.9)",
			name: t("GLOBAL_RARITY_RARE"),
		},
		epic: {
			fill: "rgba(163, 53, 238, 0.5)",
			stroke: "rgba(163, 53, 238, 0.9)",
			name: t("GLOBAL_RARITY_EPIC"),
		},
		legendary: {
			fill: "rgba(255, 128, 0, 0.5)",
			stroke: "rgba(255, 128, 0, 0.9)",
			name: t("GLOBAL_RARITY_LEGENDARY"),
		},
	};
}

function getCardtypeScheme(t: TranslationFunction): ChartScheme {
	return {
		minion: {
			fill: "rgba(171, 212, 115, 0.5)",
			stroke: "rgba(171, 212, 115, 0.9)",
			name: t("GLOBAL_CARDTYPE_MINION"),
		},
		spell: {
			fill: "rgba(0, 112, 222, 0.5)",
			stroke: "rgba(0, 112, 222, 0.9)",
			name: t("GLOBAL_CARDTYPE_SPELL"),
		},
		weapon: {
			fill: "rgba(196, 30, 59, 0.5)",
			stroke: "rgba(196, 30, 59, 0.9)",
			name: t("GLOBAL_CARDTYPE_WEAPON"),
		},
	};
}

function getClassColorScheme(t: TranslationFunction): ChartScheme {
	return {
		all: {
			stroke: "rgba(169, 169, 169, 1)",
			fill: "rgba(169, 169, 169, 0.7)",
			name: t("All"),
		},
		neutral: {
			stroke: "rgba(169, 169, 169, 1)",
			fill: "rgba(169, 169, 169, 0.7)",
			name: getHeroClassName("NEUTRAL", t),
		},
		druid: {
			stroke: "rgba(255, 125, 10, 1)",
			fill: "rgba(255, 125, 10, 0.7)",
			name: getHeroClassName("DRUID", t),
		},
		hunter: {
			stroke: "rgba(171, 212, 114, 1)",
			fill: "rgba(171, 212, 114, 0.7)",
			name: getHeroClassName("HUNTER", t),
		},
		mage: {
			stroke: "rgba(105, 204, 240, 1)",
			fill: "rgba(105, 204, 240, 0.7)",
			name: getHeroClassName("MAGE", t),
		},
		paladin: {
			stroke: "rgba(245, 140, 186, 1)",
			fill: "rgba(245, 140, 186, 0.7)",
			name: getHeroClassName("PALADIN", t),
		},
		priest: {
			stroke: "rgba(210, 210, 210, 1)",
			fill: "rgba(210, 210, 210, 0.7)",
			name: getHeroClassName("PRIEST", t),
		},
		rogue: {
			stroke: "rgba(255, 217, 26, 1)",
			fill: "rgba(255, 240, 26, 0.7)",
			name: getHeroClassName("ROGUE", t),
		},
		shaman: {
			stroke: "rgba(0, 122, 222, 1)",
			fill: "rgba(0, 122, 222, 0.7)",
			name: getHeroClassName("SHAMAN", t),
		},
		warlock: {
			stroke: "rgba(148, 130, 201, 1)",
			fill: "rgba(148, 130, 201, 0.7)",
			name: getHeroClassName("WARLOCK", t),
		},
		warrior: {
			stroke: "rgba(199, 156, 110, 1)",
			fill: "rgba(199, 156, 110, 0.7)",
			name: getHeroClassName("WARRIOR", t),
		},
		other: {
			stroke: "rgba(122, 122, 122, 1)",
			fill: "rgba(122, 122, 122, 0.7)",
			name: t("Other"),
		},
	};
}

export function getSetName(set: string, t: TranslationFunction): string {
	switch (set) {
		case "core":
			return t("GLOBAL_CARD_SET_CORE");
		case "expert1":
			return t("GLOBAL_CARD_SET_EXPERT1");
		case "hof":
			return t("GLOBAL_CARD_SET_HOF");
		case "naxx":
			return t("GLOBAL_CARD_SET_NAXX");
		case "gvg":
			return t("GLOBAL_CARD_SET_GVG");
		case "brm":
			return t("GLOBAL_CARD_SET_BRM");
		case "tgt":
			return t("GLOBAL_CARD_SET_TGT");
		case "tb":
			return t("GLOBAL_TAVERN_BRAWL");
		case "loe":
			return t("GLOBAL_CARD_SET_LOE");
		case "og":
			return t("GLOBAL_CARD_SET_OG");
		case "kara":
			return t("GLOBAL_CARD_SET_KARA");
		case "gangs":
			return t("GLOBAL_CARD_SET_GANGS");
		case "ungoro":
			return t("GLOBAL_CARD_SET_UNGORO");
		case "icecrown":
			return t("GLOBAL_CARD_SET_ICECROWN");
		case "lootapalooza":
			return t("GLOBAL_CARD_SET_LOOTAPALOOZA");
		case "gilneas":
			return t("GLOBAL_CARD_SET_GILNEAS");
		case "taverns_of_time":
			return t("Taverns of Time");
		case "boomsday":
			return t("GLOBAL_CARD_SET_BOOMSDAY");
	}
	return t("Unknown Set");
}

export function isCollectibleCard(card: HearthstoneJSONCardData): boolean {
	return card.collectible && isPlayableCard(card);
}

export function isArenaOnlyCard(card: HearthstoneJSONCardData): boolean {
	return card && card.id && card.id.startsWith("TOT_");
}

export function isPlayableCard(card: HearthstoneJSONCardData): boolean {
	if (card.type === "HERO") {
		// default heroes/skins are not collectible
		return ["CORE", "HERO_SKINS"].indexOf(card.set) === -1;
	}
	return ["MINION", "SPELL", "WEAPON"].indexOf(card.type) !== -1;
}

export function getChartMetaData(
	data: DataPoint[],
	midLine?: number,
	seasonTicks?: boolean,
	baseRoundingFactor?: number,
): ChartMetaData {
	const ticks = [];
	const xMin = data[0];
	const xMax = data[data.length - 1];
	const xCenter = +xMin.x + (+xMax.x - +xMin.x) / 2;

	if (seasonTicks) {
		const offset = 12 * 60 * 60 * 1000;
		const minDate = new Date(+xMin.x);
		const maxDate = new Date(+xMax.x);
		const season = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
		if (season.getTime() >= minDate.getTime()) {
			ticks.push(season.getTime() - offset);
			season.setMonth(season.getMonth() - 1);
			if (season.getTime() >= minDate.getTime()) {
				ticks.push(season.getTime() - offset);
			}
		} else {
			ticks.push(minDate.getTime());
		}
	}

	let yMin = data[0];
	let yMax = data[0];
	data.forEach(d => {
		if (+d.y < +yMin.y) {
			yMin = d;
		} else if (+d.y > +yMax.y) {
			yMax = d;
		}
	});

	if (!midLine) {
		midLine = (+yMax.y + +yMin.y) / 2;
	}

	const minDelta = Math.abs(midLine - +yMin.y);
	const maxDelta = Math.abs(midLine - +yMax.y);
	const midLinePosition = maxDelta / (minDelta + maxDelta);

	const top = Math.max(+yMax.y, midLine);
	const bottom = Math.min(+yMin.y, midLine);
	const delta = +yMax.y - +yMin.y;
	const deltaMag = delta ? Math.min(Math.floor(Math.log10(delta)), 0) : 0;
	const factor = 10 ** (deltaMag - 1);
	const roundingFactor = 5 * (baseRoundingFactor || 0.1) * factor * 10;
	const domainMax = Math.min(
		100,
		Math.ceil(Math.ceil(top / factor) / roundingFactor) *
			roundingFactor *
			factor,
	);
	const domainMin = Math.max(
		0,
		Math.floor(Math.floor(bottom / factor) / roundingFactor) *
			roundingFactor *
			factor,
	);

	return {
		xDomain: [+xMin.x, +xMax.x],
		xMinMax: [xMin, xMax],
		xCenter,
		yDomain: [domainMin, domainMax],
		yMinMax: [yMin, yMax],
		yCenter: midLine,
		seasonTicks: ticks,
		midLinePosition,
		toFixed: x => {
			return sliceZeros(toDynamicFixed(x, Math.max(-deltaMag, 0) + 1));
		},
	};
}

export function sliceZeros(input: string): string {
	if (!input) {
		return "";
	}
	const chars = input.split("");
	if (chars.every(x => x === "0")) {
		return "0";
	}
	let index = -1;
	chars.reverse().forEach((char, i) => {
		if (index === -1 && char !== "0") {
			index = i;
		}
	});
	if ("0123456789".indexOf(chars[index]) === -1) {
		index++;
	}
	return index === -1
		? ""
		: chars
				.slice(index)
				.reverse()
				.join("");
}

export function toPrettyNumber(n: number): string {
	const divisor = Math.max(10 ** (Math.floor(Math.log10(n)) - 1), 1);
	n = Math.floor(n / divisor) * divisor;
	return formatNumber(n, 0);
}

export function toTimeSeries(series: ChartSeries): ChartSeries {
	const timeSeries = {
		data: series.data.map(d => {
			return { x: new Date("" + d.x).getTime(), y: d.y };
		}),
		name: series.name,
		metadata: series.metadata,
	};
	timeSeries.data.sort((a, b) => +a.x - +b.x);
	return timeSeries;
}

export function getColorString(
	colors: Colors,
	intensity: number,
	winrate: number,
	mirror?: boolean,
	disable?: boolean,
): string {
	if (mirror) {
		return "black";
	}

	if (winrate === null) {
		return "#ddd";
	}

	let positive = [0, 0, 0];
	let neutral = [0, 100, 100];
	let negative = [0, 0, 0];

	switch (colors) {
		case Colors.REDGREEN:
			positive = [120, 60, 50];
			neutral = [60, 100, 100];
			negative = [0, 100, 65.7];
			break;
		case Colors.REDGREEN2:
			positive = [120, 60, 50];
			neutral = [null, 100, 100];
			negative = [0, 100, 65.7];
			break;
		case Colors.REDGREEN3:
			positive = [120, 70, 40];
			neutral = [90, 100, 15];
			negative = [0, 100, 65.7];
			break;
		case Colors.REDGREEN4:
			positive = [120, 70, 40];
			neutral = [50, 20, 50];
			negative = [0, 100, 65.7];
			break;
		case Colors.REDORANGEGREEN:
			positive = [120, 60, 50];
			neutral = [30, 100, 100];
			negative = [0, 100, 65.7];
			break;
		case Colors.ORANGEBLUE:
			positive = [202, 100, 50];
			neutral = [null, 100, 100];
			negative = [41, 100, 50];
			break;
		case Colors.HSREPLAY:
			positive = [214, 66, 34];
			neutral = [null, 100, 100];
			negative = [351, 51, 51];
			break;
	}

	if (disable) {
		positive[1] = 0;
		neutral[1] = 0;
		negative[1] = 0;
	}

	const scale = (x: number, from: number, to: number): number => {
		if (from === null || to === null) {
			return +(to || from);
		}
		x = Math.pow(x, 1 - intensity / 100);
		return from + (to - from) * x;
	};

	const scaleTriple = (
		x: number,
		from: Array<number | null>,
		to: Array<number | null>,
	): number[] => {
		return [
			scale(x, from[0], to[0]),
			scale(x, from[1], to[1]),
			scale(x, from[2], to[2]),
		];
	};

	const hsl = (values: Array<number | null>): string => {
		return (
			"hsl(" + +values[0] + ", " + +values[1] + "%, " + +values[2] + "%)"
		);
	};

	const severity = Math.abs(0.5 - winrate) * 2;

	if (winrate > 0.5) {
		return hsl(scaleTriple(severity, neutral, positive));
	} else if (winrate < 0.5) {
		return hsl(scaleTriple(severity, neutral, negative));
	}

	return hsl(neutral);
}

export function cardSorting(a: any, b: any, direction = 1): number {
	if (a.cardObj !== undefined) {
		a = a.cardObj;
	}
	if (a.card !== undefined) {
		a = a.card;
	}
	if (b.cardObj !== undefined) {
		b = b.cardObj;
	}
	if (b.card !== undefined) {
		b = b.card;
	}
	if (a.cost > b.cost) {
		return direction;
	}
	if (a.cost < b.cost) {
		return -direction;
	}
	if (!a.hideStats && b.hideStats) {
		return direction;
	}
	if (a.hideStats && !b.hideStats) {
		return -direction;
	}
	if (a.name > b.name) {
		return direction;
	}
	if (a.name < b.name) {
		return -direction;
	}
	return 0;
}

export function cardObjSorting(
	a: CardObj,
	b: CardObj,
	prop: string,
	direction: number,
): number {
	const aVal = a[prop] || 0;
	const bVal = b[prop] || 0;
	if (aVal === bVal) {
		return a.card.name > b.card.name ? -direction : direction;
	}
	return (bVal - aVal) * direction;
}

export function getHeroSkinCardUrl(cardClass: CardClass | string): string {
	return cardArt(getHeroSkinCardId(cardClass) || "HERO_01");
}

export function getHeroSkinCardId(
	cardClass: CardClass | string,
): string | null {
	const cardId = getHeroCardId(cardClass);
	if (!cardId) {
		return cardId;
	}
	if (cardId === "HERO_04") {
		return cardId + "b";
	}
	return cardId + "a";
}

export function getHeroCardId(cardClass: CardClass | string): string | null {
	switch (getCardClass(cardClass)) {
		case CardClass.WARRIOR:
			return "HERO_01";
		case CardClass.SHAMAN:
			return "HERO_02";
		case CardClass.ROGUE:
			return "HERO_03";
		case CardClass.PALADIN:
			return "HERO_04";
		case CardClass.HUNTER:
			return "HERO_05";
		case CardClass.DRUID:
			return "HERO_06";
		case CardClass.WARLOCK:
			return "HERO_07";
		case CardClass.MAGE:
			return "HERO_08";
		case CardClass.PRIEST:
			return "HERO_09";
	}

	return null;
}

export function getHeroClassName(
	cardClass: string,
	t: TranslationFunction,
): string {
	switch (cardClass) {
		case "DEATHKNIGHT":
			return t("GLOBAL_CLASS_DEATHKNIGHT");
		case "DRUID":
			return t("GLOBAL_CLASS_DRUID");
		case "HUNTER":
			return t("GLOBAL_CLASS_HUNTER");
		case "MAGE":
			return t("GLOBAL_CLASS_MAGE");
		case "PALADIN":
			return t("GLOBAL_CLASS_PALADIN");
		case "PRIEST":
			return t("GLOBAL_CLASS_PRIEST");
		case "ROGUE":
			return t("GLOBAL_CLASS_ROGUE");
		case "SHAMAN":
			return t("GLOBAL_CLASS_SHAMAN");
		case "WARLOCK":
			return t("GLOBAL_CLASS_WARLOCK");
		case "WARRIOR":
			return t("GLOBAL_CLASS_WARRIOR");
		case "DREAM":
			return t("Dream");
		case "NEUTRAL":
			return t("GLOBAL_CLASS_NEUTRAL");
	}
	return toTitleCase(cardClass);
}

export function isWildSet(set: string) {
	return wildSets.indexOf(set) !== -1;
}

export function isCraftableSet(set: string) {
	// basic cards (CORE) can never be crafted
	if (set === "CORE") {
		return false;
	}

	// everything else can be crafted
	return true;
}

export function getDustCost(card: any | any[]): number {
	if (!card) {
		return 0;
	}

	const cardCountProxy = card as any;
	if (cardCountProxy.count) {
		return getDustCost(cardCountProxy.card) * cardCountProxy.count;
	}

	if (Array.isArray(card)) {
		return card.reduce((cost, c) => cost + getDustCost(c), 0);
	}

	const set = card.set;
	if (!isCraftableSet(set)) {
		return 0;
	}

	return getDustValue(card.rarity);
}

export function getDustValue(rarity: Rarity | string): number {
	if (!rarity) {
		return 0;
	}
	switch (getRarity(rarity)) {
		case Rarity.COMMON:
			return 40;
		case Rarity.RARE:
			return 100;
		case Rarity.EPIC:
			return 400;
		case Rarity.LEGENDARY:
			return 1600;
		default:
			return 0;
	}
}

export function getManaCost(card: any | any[]): number {
	if (!card) {
		return 0;
	}

	const cardCountProxy = card as any;
	if (cardCountProxy.count) {
		return getManaCost(cardCountProxy.card) * cardCountProxy.count;
	}

	if (Array.isArray(card)) {
		return card.reduce((cost, c) => cost + getManaCost(c), 0);
	}

	return +card.cost;
}

export function winrateData(
	baseWinrate: number,
	winrate: number,
	deltaFactor: number,
) {
	const winrateDelta = winrate - baseWinrate;
	const colorWinrate =
		50 + Math.max(-50, Math.min(50, deltaFactor * winrateDelta));
	const tendencyStr =
		winrateDelta === 0 ? "    " : winrateDelta > 0 ? "▲" : "▼";
	const color = getColorString(Colors.REDGREEN3, 75, colorWinrate / 100);
	return { delta: formatNumber(winrateDelta, 1), color, tendencyStr };
}

export function cleanText(text: string): string {
	if (typeof text.normalize === "function") {
		text = text.normalize("NFD");
	}
	return text
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[\s.:-]/g, "")
		.toLowerCase();
}

export function slangToCardId(slang: string): string | null {
	switch (slang.toLowerCase()) {
		case "bgh": // Big Game Hunter
			return "EX1_005";
		case "dr6": // Mysterious Challenger
			return "AT_079";
		case "dr7": // Dr. Boom
			return "GVG_110";
		case "etc": // Elite Tauren Chieftain
			return "PRO_001";
		case "hex": // Hex
			return "EX1_246";
		case "yogg": // Yogg-Saron, Hope's End
			return "OG_134";
		case "kc": // Kill Command
			return "EX1_539";
		case "mct": // Mind Control Tech
			return "EX1_085";
		case "poly": // Polymorph
			return "CS2_022";
		case "prep": // Preparation
			return "EX1_145";
		case "rag": // Ragnaros the Firelord
			return "EX1_298";
		case "stb": // Small-Time Buccaneer
			return "CFM_325";
		case "swd": // Shadow: Word Death
			return "EX1_622";
		case "swp": // Shadow: Word Pain
			return "CS2_234";
		case "tbk": // The Black Knight
			return "EX1_002";
		case "477": // Flamewreath Faceless
		case "4mana77":
			return "OG_024";
		case "nzoth": // N'Zoth, the Corruptor
			return "OG_133";
		case "tms": // To My Side!
			return "LOOT_217";
	}
	return null;
}

export function toDynamicFixed(
	value: number,
	fractionDigits: number = 1,
): string {
	if (value === 0) {
		return "0";
	}
	const digits =
		Math.min(
			Math.max(0, Math.floor(Math.log10(1 / value))),
			7 - fractionDigits,
		) + fractionDigits;
	return formatNumber(value, digits);
}

export function cloneComponent(component, props) {
	const componentProps = { ...component.props };
	Object.keys(props).forEach(key => {
		componentProps[key] = props[key];
	});
	return React.cloneElement(component, componentProps);
}

export function getCardUrl(card: HearthstoneJSONCardData): string {
	return `/cards/${card.dbfId}/${slugify(card.name)}/`;
}

export function getArchetypeUrl(id: string | number, name: string): string {
	return `/archetypes/${id}/${slugify(name)}/`;
}

function slugify(str: string): string {
	str = str.toLowerCase().trim();
	if (typeof str.normalize === "function") {
		str = str.normalize("NFD");
	}
	return str
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^\w\s-]/g, "")
		.replace(/[-\s]+/g, "-");
}

export function getCookie(name: string): string {
	let cookieValue = null;
	if (document.cookie && document.cookie !== "") {
		const cookies = document.cookie.split(";");
		for (let cookie of cookies) {
			cookie = cookie.trim();
			// Does this cookie string begin with the name we want?
			if (cookie.substring(0, name.length + 1) === name + "=") {
				cookieValue = decodeURIComponent(
					cookie.substring(name.length + 1),
				);
				break;
			}
		}
	}
	return cookieValue;
}

export function fetchCSRF(url: string, options?) {
	if (url.match(/^((\/\/)|((.*):\/\/))/) !== null) {
		throw new Error("Refusing to do cross-domain fetch with CSRF token");
	}
	let headers = options && options.headers ? options.headers : null;
	if (!headers) {
		headers = new Headers();
	}
	if (!headers.has("x-csrftoken")) {
		headers.set("x-csrftoken", getCookie("csrftoken"));
	}
	options.headers = headers;
	return fetch(url, options);
}

export function getFragments(
	keys: string[],
	overwrite?: { [key: string]: string },
) {
	if (!window || !window.location) {
		return "";
	}
	const fragments = Fragments.parseFragmentString(window.location.hash);
	Object.keys(fragments).forEach(key => {
		if (keys.indexOf(key) === -1) {
			delete fragments[key];
		}
	});
	if (overwrite) {
		Object.keys(overwrite).forEach(key => {
			fragments[key] = overwrite[key];
		});
	}
	if (Object.keys(fragments).length === 0) {
		return "";
	}
	return Fragments.encodeFragmentString(fragments);
}

export function sortCards(a, b): number {
	if (a["cost"] === b["cost"]) {
		if (a["name"] === b["name"]) {
			return 0;
		}
		return a["name"] > b["name"] ? 1 : -1;
	}
	return a["cost"] > b["cost"] ? 1 : -1;
}

export function hexToHsl(hex: string): number[] {
	if (hex.startsWith("#")) {
		hex = hex.substr(1);
	}
	const red = parseInt(hex.substr(0, 2), 16) / 255;
	const green = parseInt(hex.substr(2, 2), 16) / 255;
	const blue = parseInt(hex.substr(4, 2), 16) / 255;
	const vMax = Math.max(red, green, blue);
	const vMin = Math.min(red, green, blue);
	const lightness = (vMax + vMin) / 2;
	if (vMax === vMin) {
		return [0, 0, lightness * 100];
	} else {
		const delta = vMax - vMin;
		const saturation =
			lightness > 0.5 ? delta / (2 - vMax - vMin) : delta / (vMax + vMin);
		let hue = 0;
		switch (vMax) {
			case red:
				hue = (green - blue) / delta + (green < blue ? 6 : 0);
				break;
			case green:
				hue = (blue - red) / delta + 2;
				break;
			case blue:
				hue = (red - green) / delta + 4;
				break;
		}
		return [hue * 60, saturation * 100, lightness * 100];
	}
}

export function stringifyHsl(h: number, s: number, l: number): string {
	return `hsl(${Math.floor(h)},${Math.floor(s)}%,${Math.floor(l)}%)`;
}

export function pieScaleTransform(
	props: { origin: { x: number; y: number } },
	scale: number,
): string {
	const origin = Object.assign({ x: 0, y: 0 }, props.origin);
	return `translate(${origin.x}px, ${origin.y}px) scale(${+scale})`;
}

export function getHeroCard(
	cardData: CardData,
	player: GlobalGamePlayer,
): HearthstoneJSONCardData {
	const cardId = getHeroCardId(player.hero_class_name);
	if (cardId === null) {
		return null;
	}
	return cardData.fromCardId(cardId);
}

export function getHeroDbfId(
	cardData: CardData,
	player: GlobalGamePlayer,
): number {
	if (player.hero_id.startsWith("HERO_")) {
		return player.hero_dbf_id;
	}
	const card = getHeroCard(cardData, player);
	return card ? card.dbfId : 0;
}

export function getCardClassName(cardClass: CardClass): string {
	switch (cardClass) {
		case CardClass.DEATHKNIGHT:
			return "DEATHKNIGHT";
		case CardClass.DRUID:
			return "DRUID";
		case CardClass.HUNTER:
			return "HUNTER";
		case CardClass.MAGE:
			return "MAGE";
		case CardClass.PALADIN:
			return "PALADIN";
		case CardClass.PRIEST:
			return "PRIEST";
		case CardClass.ROGUE:
			return "ROGUE";
		case CardClass.SHAMAN:
			return "SHAMAN";
		case CardClass.WARLOCK:
			return "WARLOCK";
		case CardClass.WARRIOR:
			return "WARRIOR";
		case CardClass.DREAM:
			return "DREAM";
		case CardClass.NEUTRAL:
			return "NEUTRAL";
		default:
			return "INVALID";
	}
}

export function getOtherArchetype(
	archetypeId: number,
	t: TranslationFunction,
): Archetype {
	if (archetypeId > 0) {
		return undefined;
	}
	const classId = -archetypeId;
	const className = getCardClassName(classId);

	if (className === "INVALID") {
		return undefined;
	}

	return {
		id: archetypeId,
		name: t("Other {cardClass}", {
			cardClass: getHeroClassName(className, t),
		}),
		player_class: -archetypeId,
		player_class_name: className,
		url: "",
	};
}

export function compareDecks(dbfIdsA: number[], dbfIdsB: number[]): boolean {
	const lengthB = dbfIdsB.length;
	if (dbfIdsA.length !== lengthB) {
		return false;
	}
	dbfIdsA = dbfIdsA.slice();
	dbfIdsB = dbfIdsB.slice();
	let a;
	while ((a = dbfIdsA.pop()) !== undefined) {
		let found = false;
		for (let i = 0; i < lengthB; i++) {
			if (dbfIdsB[i] === a) {
				dbfIdsB[i] = undefined;
				found = true;
				break;
			}
		}
		if (!found) {
			return false;
		}
	}
	return dbfIdsB.every(x => x === undefined);
}

export function classImageOffset(cardClass: CardClass | string): number {
	switch (cardClass) {
		case "DRUID":
		case CardClass.DRUID:
			return 0.29;
		case "HUNTER":
		case CardClass.HUNTER:
			return 0.22;
		case "MAGE":
		case CardClass.MAGE:
			return 0.28;
		case "PALADIN":
		case CardClass.PALADIN:
			return 0.2;
		case "PRIEST":
		case CardClass.PRIEST:
			return 0.22;
		case "ROGUE":
		case CardClass.ROGUE:
			return 0.32;
		case "SHAMAN":
		case CardClass.SHAMAN:
			return 0.28;
		case "WARLOCK":
		case CardClass.WARLOCK:
			return 0.36;
		case "WARRIOR":
		case CardClass.WARRIOR:
			return 0.22;
	}
}
