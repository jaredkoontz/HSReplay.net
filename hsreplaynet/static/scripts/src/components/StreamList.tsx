import React from "react";
import { withLoading } from "./loading/Loading";
import StreamThumbnail from "./StreamThumbnail";
import { Stream as ApiStream } from "../utils/api";

interface TwitchStream {
	language: string;
	thumbnail_url: string;
	title: string;
	user_id: string;
	viewer_count: number;
}

interface Props {
	streams?: ApiStream[];
	verifyExtension?: boolean;
}

interface State {
	metadata: TwitchStream[] | null;
}

class StreamList extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			metadata: null,
		};
	}

	public componentDidMount(): void {
		Promise.all([
			StreamList.fetchMetadata(this.props.streams),
			this.props.verifyExtension
				? StreamList.fetchEnabled()
				: Promise.resolve(null),
		]).then(([streamsForDeck, streamsWithExtension]): void => {
			let eligibleStreams;
			if (streamsWithExtension !== null) {
				eligibleStreams = streamsForDeck.filter(
					streamForDeck =>
						!!streamsWithExtension.find(
							(streamWithExtension): boolean =>
								streamWithExtension.id ===
								streamForDeck.user_id,
						),
				);
			} else {
				eligibleStreams = streamsForDeck;
			}
			this.setState({ metadata: eligibleStreams });
		});
	}

	static async fetchMetadata(streams: ApiStream[]): Promise<TwitchStream[]> {
		const user_params = streams.map(
			stream => `user_login=${stream.twitch.name}`,
		);
		let resultSet = [];
		let cursor = null;
		do {
			const params = user_params.slice();
			if (cursor !== null) {
				params.push(`after=${cursor}`);
			}
			const response = await fetch(
				`https://api.twitch.tv/helix/streams?${params.join("&")}`,
				{
					headers: {
						"Client-ID": "k0lqdqxso1o3knvydfheacq3jbqidg",
					},
				},
			);
			const { pagination, data } = await response.json();
			cursor = pagination ? pagination.cursor : null;
			if (data) {
				resultSet = resultSet.concat(data);
			}
		} while (resultSet.length < streams.length && cursor);
		return resultSet;
	}

	static async fetchEnabled(): Promise<{ id: string }[]> {
		let resultSet = [];
		let cursor = null;
		do {
			let url = `https://api.twitch.tv/extensions/${"apwln3g3ia45kk690tzabfp525h9e1"}/live_activated_channels`;
			if (cursor) {
				url += `?cursor=${cursor}`;
			}
			const response = await fetch(url, {
				headers: {
					"Client-ID": "k0lqdqxso1o3knvydfheacq3jbqidg",
				},
			});
			const json = await response.json();
			resultSet = resultSet.concat(json.channels);
			cursor = json.cursor;
		} while (cursor);
		return resultSet;
	}

	public render(): React.ReactNode {
		if (!this.props.streams || !Array.isArray(this.props.streams)) {
			return null;
		}

		if (this.state.metadata === null) {
			return <h3 className="message-wrapper">Loading...</h3>;
		}

		return (
			<ul className="stream-list">
				{this.state.metadata.map((twitchStream: TwitchStream) => {
					const stream = this.props.streams.find(
						(toCompare: ApiStream) =>
							"" + toCompare.twitch._id === twitchStream.user_id,
					);
					const url = `https://www.twitch.tv/${stream.twitch.name}`;
					return (
						<li key={twitchStream.user_id}>
							<StreamThumbnail
								displayName={stream.twitch.display_name}
								url={url}
								thumbnailUrl={twitchStream.thumbnail_url}
								thumbnailWidth={400}
								thumbnailHeight={225}
								title={twitchStream.title}
								viewerCount={twitchStream.viewer_count}
								gameType={stream.game_type}
								rank={stream.rank}
								legendRank={stream.legend_rank}
							/>
						</li>
					);
				})}
				<li>
					<StreamThumbnail
						title="Add your own stream to HSReplay.net…"
						displayName="Using our Twitch Extension for Hearthstone Deck Tracker."
						url={"https://hsdecktracker.net/twitch/setup/"}
						thumbnailWidth={400}
						thumbnailHeight={225}
						noMetrics
					/>
				</li>
			</ul>
		);
	}
}

export default withLoading(["streams"])(StreamList);
