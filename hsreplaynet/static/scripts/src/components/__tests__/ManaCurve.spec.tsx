import ManaCurve from "../ManaCurve";
import * as React from "react";
import renderer from "react-test-renderer";
import { CardObj } from "../../interfaces";

describe("ManaCurve", () => {
	test("renders correctly", () => {
		const firebatDruidDeck: CardObj[] = [
			{ card: { cost: 0 }, count: 2 },
			{ card: { cost: 2 }, count: 2 },
			{ card: { cost: 2 }, count: 2 },
			{ card: { cost: 2 }, count: 2 },
			{ card: { cost: 3 }, count: 2 },
			{ card: { cost: 3 }, count: 2 },
			{ card: { cost: 4 }, count: 2 },
			{ card: { cost: 4 }, count: 2 },
			{ card: { cost: 4 }, count: 2 },
			{ card: { cost: 5 }, count: 1 },
			{ card: { cost: 5 }, count: 2 },
			{ card: { cost: 5 }, count: 1 },
			{ card: { cost: 5 }, count: 1 },
			{ card: { cost: 5 }, count: 2 },
			{ card: { cost: 6 }, count: 1 },
			{ card: { cost: 7 }, count: 2 },
			{ card: { cost: 7 }, count: 1 },
			{ card: { cost: 9 }, count: 1 },
		];

		const component = renderer.create(
			<ManaCurve cards={firebatDruidDeck} />,
		);
		let tree = component.toJSON();
		expect(tree).toMatchSnapshot();
	});

	test("ignores cost differences above 7", () => {
		const threeSevensDeck: CardObj[] = [
			{ card: { cost: 7 }, count: 1 },
			{ card: { cost: 7 }, count: 2 },
		];
		const threeEightsDeck: CardObj[] = [
			{ card: { cost: 8 }, count: 2 },
			{ card: { cost: 8 }, count: 1 },
		];

		const threeSevensComponent = renderer.create(
			<ManaCurve cards={threeSevensDeck} />,
		);

		const threeEightsComponent = renderer.create(
			<ManaCurve cards={threeEightsDeck} />,
		);

		let threeSevensTree = threeSevensComponent.toJSON();
		let threeEightsTree = threeEightsComponent.toJSON();
		expect(threeSevensTree).toMatchObject(threeEightsTree);
	});
});
