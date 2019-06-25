import { cardSorting, getDeckShortId } from "../helpers";

describe("getDeckShortId", () => {
	test("returns null for bad input", () => {
		const shortId = getDeckShortId([]);
		expect(shortId).toBeNull();
	});
	test("return expected shortId", () => {
		const cards = [
			"UNG_952",
			"UNG_015",
			"CS2_093",
			"CS2_093",
			"EX1_507",
			"EX1_507",
			"EX1_509",
			"EX1_509",
			"UNG_089",
			"UNG_089",
			"EX1_103",
			"EX1_103",
			"NEW1_041",
			"CFM_650",
			"CFM_650",
			"CS2_173",
			"CS2_173",
			"EX1_349",
			"EX1_383",
			"CS2_097",
			"CS2_097",
			"CFM_344",
			"UNG_073",
			"UNG_073",
			"OG_006",
			"OG_006",
			"CS2_092",
			"CS2_092",
			"UNG_011",
			"UNG_011",
		];
		const shortId = getDeckShortId(cards);
		expect(shortId).toBe("ZrydJsC1jKZ3TpSiFWQXNg");
	});
});

describe("cardSorting", () => {
	it("should correctly sort cards with hideStats to the front", () => {
		expect(
			[
				{
					dbfId: 179,
					name: "Wisp",
					cost: 0,
				},
				{
					dbfId: 53950,
					cost: 0,
					name: "The Box",
					hideStats: true,
				},
				{
					dbfId: 179,
					name: "Wisp",
					cost: 0,
				},
			].sort(cardSorting),
		).toEqual([
			{
				dbfId: 53950,
				cost: 0,
				name: "The Box",
				hideStats: true,
			},
			{
				dbfId: 179,
				name: "Wisp",
				cost: 0,
			},
			{
				dbfId: 179,
				name: "Wisp",
				cost: 0,
			},
		]);
	});

	it("should correctly sort cards by cost", () => {
		expect(
			[
				{
					dbfId: 639,
					name: "Lightning Storm",
					cost: 3,
				},
				{
					dbfId: 1171,
					name: "Bloodlust",
					cost: 5,
				},
				{
					dbfId: 2005,
					name: "Whirling Zap-o-matic",
					cost: 2,
				},
			].sort(cardSorting),
		).toEqual([
			{
				dbfId: 2005,
				name: "Whirling Zap-o-matic",
				cost: 2,
			},
			{
				dbfId: 639,
				name: "Lightning Storm",
				cost: 3,
			},
			{
				dbfId: 1171,
				name: "Bloodlust",
				cost: 5,
			},
		]);
	});

	it("should correctly sort cards with matching costs by name", () => {
		expect(
			[
				{
					dbfId: 52111,
					cost: 3,
					name: "EVIL Miscreant",
				},
				{
					dbfId: 56223,
					name: "SN1P-SN4P",
					cost: 3,
				},
				{
					dbfId: 1117,
					name: "SI:7 Agent",
					cost: 3,
				},
				{
					dbfId: 306,
					name: "Edwin VanCleef",
					cost: 3,
				},
			].sort(cardSorting),
		).toEqual([
			{
				dbfId: 306,
				name: "Edwin VanCleef",
				cost: 3,
			},
			{
				dbfId: 52111,
				cost: 3,
				name: "EVIL Miscreant",
			},
			{
				dbfId: 1117,
				name: "SI:7 Agent",
				cost: 3,
			},
			{
				dbfId: 56223,
				name: "SN1P-SN4P",
				cost: 3,
			},
		]);
	});
});
