import { getDeckShortId } from "../helpers";

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
