import React from "react";
import ProfileHero from "../ProfileHero";
import renderer from "react-test-renderer";

describe("ProfileHero", () => {
	test("does render with without name", () => {
		const component = renderer.create(<ProfileHero cardId={"HERO_07"} />);
		const tree = component.toJSON();
		expect(tree).toBeDefined();
		expect(tree.children.length).toBe(1);
		expect(tree.children[0].children.length).toBe(2);
		expect(tree.children[0].children[0].props.src).toBe(
			"https://art.hearthstonejson.com/v1/256x/HERO_07.jpg",
		);
		expect(tree.children[0].children[1].props.src).toBe(
			"/static/images/profile-hero-frame.png",
		);
		expect(tree).toMatchSnapshot();
	}),
		test("does render with name", () => {
			const component = renderer.create(
				<ProfileHero cardId={"HERO_07"} name="Test Name" />,
			);
			const tree = component.toJSON();
			expect(tree).toBeDefined();
			expect(tree.children.length).toBe(2);
			expect(tree.children[1].children[0]).toBe("Test Name");
			expect(tree).toMatchSnapshot();
		});
});
