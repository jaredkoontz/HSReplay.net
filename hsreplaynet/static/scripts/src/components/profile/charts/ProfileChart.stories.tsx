import React from "react";
import { storiesOf } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import WinrateChart from "./WinrateChart";
import { Aggregation } from "./ProfileChart";

const Root = props => (
	<div style={{ height: "400px", display: "flex" }}>{props.children}</div>
);

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

const stories = storiesOf("ProfileChart", module);

stories.add("winrate over seasons", () => (
	<Root>
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
		/>
	</Root>
));

stories.add("winrate over days", () => (
	<Root>
		<WinrateChart
			data={{
				winrateByDay: WINRATES.map((winrate, i) => ({
					year: 2018,
					day: i + 1,
					winrate: winrate / 100,
				})),
			}}
			aggregate={Aggregation.BY_DAY}
			averageWinrate={57.4 / 100}
		/>
	</Root>
));
