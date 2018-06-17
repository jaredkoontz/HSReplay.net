export interface TwitchStreamResponse {
	[username: string]: TwitchStream;
}

export interface TwitchStream {
	language: string;
	thumbnail_url: string;
	title: string;
	user_id: string;
	viewer_count: number;
	type: string;
}

export default class Twitch {
	private static readonly ClientId: string = "k0lqdqxso1o3knvydfheacq3jbqidg";
	private static readonly HSReplaynetExtId: string = "apwln3g3ia45kk690tzabfp525h9e1";
	private static readonly BaseUrl: string = "https://api.twitch.tv";

	public static async fetchStreamMetadata(
		usernames: string[],
	): Promise<TwitchStreamResponse> {
		const userParams = usernames.map(stream => `user_login=${stream}`);
		const response = await fetch(
			`/api/v1/live/twitch/streams?${userParams.join("&")}`,
		);
		return await response.json();
	}

	public static async fetchEnabledTwitchExtensions(): Promise<
		{ id: string }[]
	> {
		let resultSet = [];
		let cursor = null;
		do {
			let url = `${Twitch.BaseUrl}/extensions/${
				Twitch.HSReplaynetExtId
			}/live_activated_channels`;
			if (cursor) {
				url += `?cursor=${cursor}`;
			}
			const response = await fetch(url, {
				headers: {
					"Client-ID": Twitch.ClientId,
				},
			});
			const json = await response.json();
			resultSet = resultSet.concat(json.channels);
			cursor = json.cursor;
		} while (cursor);
		return resultSet;
	}

	public static isLive(stream: TwitchStream): boolean {
		return stream && stream.type === "live";
	}
}