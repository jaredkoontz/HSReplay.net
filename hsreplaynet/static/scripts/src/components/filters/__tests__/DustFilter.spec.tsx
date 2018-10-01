import React from "react";
import DustFilter from "../DustFilter";
import renderer from "react-test-renderer";
import { mount } from "enzyme";

describe("DustFilter", () => {
	test("renders correctly", () => {
		const component = renderer.create(
			<DustFilter dust={1600} setDust={jest.fn()} ownedDust={400} />,
		);
		const tree = component.toJSON();
		expect(tree).toMatchSnapshot();
	});

	test("calls setDust if the form is submitted", () => {
		const setDust = jest.fn();
		const wrapper = mount(
			<DustFilter dust={1600} setDust={setDust} ownedDust={2000} />,
		);
		expect(wrapper).toMatchSnapshot("1600");
		expect(setDust).not.toHaveBeenCalled();
		(wrapper.find("input").instance() as any).value = "200";
		wrapper.find("input").simulate("change");
		wrapper.find("form").simulate("submit");
		expect(setDust).toHaveBeenCalledTimes(1);
		expect(setDust).toHaveBeenCalledWith(200);
		expect(wrapper).toMatchSnapshot("200");
	});

	test("calls setDust if the input is blurred", () => {
		const setDust = jest.fn();
		const wrapper = mount(
			<DustFilter dust={1600} setDust={setDust} ownedDust={2000} />,
		);
		expect(wrapper).toMatchSnapshot("1600");
		expect(setDust).not.toHaveBeenCalled();
		(wrapper.find("input").instance() as any).value = "200";
		wrapper.find("input").simulate("change");
		wrapper.find("input").simulate("blur");
		expect(setDust).toHaveBeenCalledTimes(1);
		expect(setDust).toHaveBeenCalledWith(200);
		expect(wrapper).toMatchSnapshot("200");
	});
});
