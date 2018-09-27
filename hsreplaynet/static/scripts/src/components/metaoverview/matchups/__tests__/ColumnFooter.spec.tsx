import React from "react";
import ColumnFooter from "../ColumnFooter";
import renderer from "react-test-renderer";
import { mount } from "enzyme";

describe("ColumnFooter", () => {
	test("renders correctly", () => {
		const onWeightChanged = jest.fn();
		const component = renderer.create(
			<ColumnFooter
				weight={25}
				onWeightChanged={onWeightChanged}
				max={100}
			/>,
		);
		const tree = component.toJSON();
		expect(tree).toMatchSnapshot();
		expect(onWeightChanged).not.toHaveBeenCalled();
	});

	test("renders correctly when editable", () => {
		const onWeightChanged = jest.fn();
		const component = renderer.create(
			<ColumnFooter
				weight={25}
				editable
				onWeightChanged={onWeightChanged}
				max={100}
			/>,
		);
		const tree = component.toJSON();
		expect(tree).toMatchSnapshot();
		expect(onWeightChanged).not.toHaveBeenCalled();
	});

	test("allows inputting a custom weight", () => {
		const onWeightChanged = jest.fn();
		const wrapper = mount(
			<ColumnFooter
				weight={25}
				editable
				onWeightChanged={onWeightChanged}
				max={100}
			/>,
		);
		expect(wrapper).toMatchSnapshot("25");
		expect(onWeightChanged).not.toHaveBeenCalled();
		(wrapper.find("input").instance() as any).value = "2";
		wrapper.find("input").simulate("change");
		expect(wrapper).toMatchSnapshot("2");
		expect(onWeightChanged).toHaveBeenCalledWith(2);
	});
});
