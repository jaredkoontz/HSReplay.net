import RankPicker from "../RankPicker";
import React from "react";
import renderer from "react-test-renderer";
import { mount } from "enzyme";

describe("RankPicker", () => {
	test("renders correctly", () => {
		const onSelectionChanged = jest.fn();
		const component = renderer.create(
			<RankPicker
				selected={"LEGEND_THROUGH_TWENTYFIVE"}
				onSelectionChanged={onSelectionChanged}
			/>,
		);
		const tree = component.toJSON();
		expect(tree).toMatchSnapshot();
		expect(onSelectionChanged).not.toHaveBeenCalled();
	});

	test("allows selecting a single Rank", () => {
		const ALL_RANKS = "LEGEND_THROUGH_TWENTYFIVE";
		const RANK_SEVENTEEN = "SEVENTEEN";
		const onSelectionChanged = jest.fn();
		const wrapper = mount(
			<RankPicker
				selected={ALL_RANKS}
				onSelectionChanged={onSelectionChanged}
			/>,
		);
		expect(onSelectionChanged).not.toHaveBeenCalled();
		expect(wrapper).toMatchSnapshot("all");
		wrapper.find('button > img[alt="Rank 17"]').simulate("click");
		expect(onSelectionChanged).toHaveBeenCalledWith(RANK_SEVENTEEN);
		expect(wrapper).toMatchSnapshot("rank 17");
	});

	test("shows selected rows", () => {
		const onSelectionChanged = jest.fn();
		const component = renderer.create(
			<RankPicker
				selected={"ONE_THROUGH_FIVE"}
				onSelectionChanged={onSelectionChanged}
			/>,
		);
		const tree = component.toJSON();
		expect(tree).toMatchSnapshot();
		expect(onSelectionChanged).not.toHaveBeenCalled();
	});

	test("shows selected ranks", () => {
		const onSelectionChanged = jest.fn();
		const component = renderer.create(
			<RankPicker
				selected={"FIVE"}
				onSelectionChanged={onSelectionChanged}
			/>,
		);
		const tree = component.toJSON();
		expect(tree).toMatchSnapshot();
		expect(onSelectionChanged).not.toHaveBeenCalled();
	});
});
