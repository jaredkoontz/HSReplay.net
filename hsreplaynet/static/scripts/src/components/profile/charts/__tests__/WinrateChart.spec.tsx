import React from "react";
import WinrateChart from "../WinrateChart";
import { Aggregation } from "../ProfileChart";
import { mount } from "enzyme";

const WINRATES = [
	51.5,
	52.4,
	50.9,
	53.8,
	52.25,
	52.0,
	52.25,
	50.4,
	53.5,
	52.5,
	54.2,
	55.9,
];

describe("WinrateChart", () => {
	test("renders by season", () => {
		const wrapper = mount(
			<WinrateChart
				data={{
					winrateBySeason: WINRATES.map((winrate, i) => ({
						year: 2018,
						season: i + 1,
						winrate: winrate / 100,
					})),
				}}
				aggregate={Aggregation.BY_SEASON}
				averageWinrate={57.4 / 100}
			/>,
		);
		expect(wrapper).toMatchSnapshot();
	});

	test("renders by day", () => {
		const wrapper = mount(
			<WinrateChart
				data={{
					winrateByDay: WINRATES.map((winrate, i) => ({
						year: 2018,
						day: i,
						winrate: winrate / 100,
					})),
				}}
				aggregate={Aggregation.BY_DAY}
				averageWinrate={57.4 / 100}
			/>,
		);
		expect(wrapper).toMatchSnapshot();
	});
});
