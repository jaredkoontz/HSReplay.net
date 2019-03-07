import NitropayAdUnit from "../NitropayAdUnit";
import renderer from "react-test-renderer";
import * as React from "react";
import UserData from "../../../UserData";
import AdHelper from "../../../AdHelper";

describe("AdUnit", () => {
	test("does render when ad feature is enabled", () => {
		UserData.hasFeature = feature => feature === "ads";
		AdHelper.isAdEnabled = id => id === "ad-42";
		const component = renderer.create(
			<NitropayAdUnit id="ad-42" size="300x250" />,
		);
		const tree = component.toJSON();
		expect(tree).toBeDefined();
		expect(tree).toMatchSnapshot();
	});

	test("does not render when ad feature is disabled", () => {
		AdHelper.isAdEnabled = id => id === "ad-42";
		UserData.hasFeature = () => false;
		const component = renderer.create(
			<NitropayAdUnit id="ad-42" size="300x250" />,
		);
		expect(component.toJSON()).toBeNull();
	});

	test("does not render for premium user", () => {
		UserData.hasFeature = feature => feature === "ads";
		AdHelper.isAdEnabled = id => id === "ad-42";
		UserData.isPremium = () => true;
		const component = renderer.create(
			<NitropayAdUnit id="ad-42" size="300x250" />,
		);
		expect(component.toJSON()).toBeNull();
	});

	test("does render correctly in debug mode", () => {
		UserData.hasFeature = feature =>
			["ads", "ads-admin"].indexOf(feature) !== -1;
		const component = renderer.create(
			<NitropayAdUnit id="ad-42" size="300x250" />,
		);
		const tree = component.toJSON();
		expect(tree.children[0].children[1].children[0]).toBe("ad-42");
		expect(tree).toBeDefined();
		expect(tree).toMatchSnapshot();
	});
});
