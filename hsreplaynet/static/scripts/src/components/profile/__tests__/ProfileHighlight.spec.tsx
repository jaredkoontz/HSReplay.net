import React from "react";
import ProfileHighlight from "../ProfileHighlight";
import renderer from "react-test-renderer";

describe("ProfileHighlight", () => {
	test("does render with string highlight", () => {
		const component = renderer.create(
			<ProfileHighlight
				header="HEADER"
				subtitle="SUBTITLE"
				highlight="HIGHLIGHT"
			/>,
		);
		const tree = component.toJSON();
		expect(tree).toBeDefined();
		expect(tree.children[0].children[0].children[0].children[0]).toBe(
			"HIGHLIGHT",
		);
		expect(tree.children[1].children[0].children[0].children[0]).toBe(
			"HEADER",
		);
		expect(tree.children[1].children[0].children[1].children[0]).toBe(
			"SUBTITLE",
		);
		expect(tree).toMatchSnapshot();
	}),
		test("does render with component highlight", () => {
			const component = renderer.create(
				<ProfileHighlight
					header="HEADER"
					subtitle="SUBTITLE"
					highlight={<figure id="TEST_ID" />}
				/>,
			);
			const tree = component.toJSON();
			expect(tree).toBeDefined();
			expect(tree.children[0].children[0].children[0].type).toBe(
				"figure",
			);
			expect(tree.children[0].children[0].children[0].props.id).toBe(
				"TEST_ID",
			);
			expect(tree).toMatchSnapshot();
		});
});
