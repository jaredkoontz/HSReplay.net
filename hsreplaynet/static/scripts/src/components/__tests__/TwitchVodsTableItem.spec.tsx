import TwitchVodsTableItem from "../TwitchVodsTableItem";
import React from "react";
import renderer from "react-test-renderer";

describe("TwitchVodsTableItem", () => {
	test("renders correctly", () => {
		Date.now = jest.fn(() => new Date("2018-10-22T20:14:00Z"));
		const component = renderer.create(
			<TwitchVodsTableItem
				rank={0}
				legendRank={1234}
				channelName={"HearthSim"}
				won
				wentFirst
				gameLengthSeconds={1337}
				gameDate={new Date("2018-10-22T20:13:30Z")}
				opposingPlayerClass={"MAGE"}
				opposingArchetype={null}
				gameType={"BGT_RANKED_STANDARD"}
				cardData={null as any}
			/>,
		);
		const tree = component.toJSON();
		expect(tree).toMatchSnapshot();
	});
});
