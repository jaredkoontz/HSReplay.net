import TwitchVodsTable from "../TwitchVodsTable";
import React from "react";
import { mount } from "enzyme";

const VODS = [
	{
		channel_name: "Zuhex",
		url: "https://www.twitch.tv/videos/320509363?t=3h10m4s",
		game_date: "2018-10-09T00:00:00Z",
		game_type: "BGT_RANKED_STANDARD",
		rank: null,
		legend_rank: 1555,
		friendly_player_archetype_id: null,
		opposing_player_class: null,
		opposing_player_archetype_id: null,
		won: true,
		went_first: null,
		game_length_seconds: 355,
		replay_shortid: "1",
	},
	{
		channel_name: "AicoritY",
		url: "https://www.twitch.tv/videos/320346544?t=0h23m9s",
		game_date: "2018-10-14T00:00:00Z",
		game_type: "BGT_RANKED_STANDARD",
		rank: 2,
		legend_rank: null,
		friendly_player_archetype_id: null,
		opposing_player_class: "MAGE",
		opposing_player_archetype_id: null,
		won: false,
		went_first: true,
		game_length_seconds: 159,
		replay_shortid: "2",
	},
	{
		channel_name: "brandonsmithx01",
		url: "https://www.twitch.tv/videos/320472337?t=6h57m12s",
		game_date: "2018-10-18T23:00:00Z",
		game_type: "BGT_RANKED_STANDARD",
		rank: 1,
		legend_rank: null,
		friendly_player_archetype_id: null,
		opposing_player_class: "PRIEST",
		opposing_player_archetype_id: 226,
		won: true,
		went_first: true,
		game_length_seconds: 558,
		replay_shortid: "3",
	},
	{
		channel_name: "해까닥여울이",
		url: "https://www.twitch.tv/videos/318585453?t=2h3m47s",
		game_date: "2018-10-15T00:00:00Z",
		game_type: "BGT_RANKED_STANDARD",
		rank: null,
		legend_rank: 123,
		friendly_player_archetype_id: 11,
		opposing_player_class: "HUNTER",
		opposing_player_archetype_id: null,
		won: false,
		went_first: false,
		game_length_seconds: 690,
		replay_shortid: "4",
	},
];

describe("TwitchVodsTable", () => {
	test("renders correctly", () => {
		Date.now = jest.fn(() => new Date("2018-10-22T20:14:00Z"));
		const selectedVod = VODS[0];
		const onSelectVod = jest.fn();
		const wrapper = mount(
			<TwitchVodsTable
				archetypeData={[]}
				gameType={"BGT_RANKED_STANDARD"}
				cardData={null as any}
				vods={VODS}
				selectedVod={selectedVod}
				onSelectVod={onSelectVod}
			/>,
		);
		expect(wrapper).toMatchSnapshot("default");
	});

	test("allows selecting a VOD", () => {
		Date.now = jest.fn(() => new Date("2018-10-22T20:14:00Z"));
		const selectedVod = VODS[0];
		const selectVod = jest.fn();
		const wrapper = mount(
			<TwitchVodsTable
				archetypeData={[]}
				gameType={"BGT_RANKED_STANDARD"}
				cardData={null as any}
				vods={VODS}
				selectedVod={selectedVod}
				onSelectVod={selectVod}
			/>,
		);
		wrapper.find('span[children="brandonsmithx01"]').simulate("click");
		expect(selectVod).toHaveBeenCalledTimes(1);
		expect(selectVod).toHaveBeenCalledWith(VODS[2]);
		expect(wrapper).toMatchSnapshot("brandonsmithx01");
	});
});
