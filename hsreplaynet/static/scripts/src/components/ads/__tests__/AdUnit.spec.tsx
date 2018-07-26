import AdUnit from "../AdUnit";
import renderer from "react-test-renderer";
import * as React from "react";
import UserData from "../../../UserData";

describe("AdUnit", () => {
	test("does render when ad feature is enabled", () => {
		UserData.hasFeature = feature => feature === "ads";
		const component = renderer.create(<AdUnit id="ad-42" size="300x250" />);
		const tree = component.toJSON();
		expect(tree).toBeDefined();
		expect(tree).toMatchSnapshot();
	});

	test("does not render when ad feature is disabled", () => {
		UserData.hasFeature = () => false;
		const component = renderer.create(<AdUnit id="ad-42" size="300x250" />);
		expect(component.toJSON()).toBeNull();
	});

	test("does not render for premium user", () => {
		UserData.hasFeature = feature => feature === "ads";
		UserData.isPremium = () => true;
		const component = renderer.create(<AdUnit id="ad-42" size="300x250" />);
		expect(component.toJSON()).toBeNull();
	});

	test("does render correctly in debug mode", () => {
		UserData.hasFeature = feature =>
			["ads", "ads-debug"].indexOf(feature) !== -1;
		const component = renderer.create(<AdUnit id="ad-42" size="300x250" />);
		const tree = component.toJSON();
		expect(tree.children[0].children[0]).toBe("ad-42");
		expect(tree).toBeDefined();
		expect(tree).toMatchSnapshot();
	});
});
