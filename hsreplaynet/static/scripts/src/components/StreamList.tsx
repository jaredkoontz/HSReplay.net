import React from "react";
import { withLoading } from "./loading/Loading";
import StreamThumbnail from "./StreamThumbnail";
import { Stream as ApiStream } from "../utils/api";
import { InjectedTranslateProps, translate } from "react-i18next";
import Twitch, { TwitchStream } from "../Twitch";
import LoadingSpinner from "./LoadingSpinner";

interface Props extends InjectedTranslateProps {
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
		const streamers = this.props.streams.map(stream => stream.twitch.name);
		Promise.all([
			Twitch.fetchStreamMetadata(streamers),
			this.props.verifyExtension
				? Twitch.fetchEnabledTwitchExtensions()
				: Promise.resolve(null),
		]).then(([streamsForDeck, streamsWithExtension]): void => {
			let eligibleStreams = streamers.map(
				streamer => streamsForDeck[streamer],
			);
			if (streamsWithExtension !== null) {
				eligibleStreams = eligibleStreams.filter(
					streamForDeck =>
						!!streamsWithExtension.find(
							(streamWithExtension): boolean =>
								streamWithExtension.id ===
								streamForDeck.user_id,
						),
				);
			}
			eligibleStreams = eligibleStreams.sort(
				(a, b) => b.viewer_count - a.viewer_count,
			);
			this.setState({ metadata: eligibleStreams });
		});
	}

	public render(): React.ReactNode {
		const { t } = this.props;

		if (!this.props.streams || !Array.isArray(this.props.streams)) {
			return null;
		}

		if (this.state.metadata === null) {
			return (
				<h3 className="message-wrapper">
					<LoadingSpinner active />
				</h3>
			);
		}

		return (
			<ul className="stream-list">
				{this.state.metadata.map((twitchStream: TwitchStream) => {
					const stream = this.props.streams.find(
						(toCompare: ApiStream) =>
							"" + toCompare.twitch._id === twitchStream.user_id,
					);
					if (!stream) {
						return null;
					}
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
						title={t("Add your own stream to HSReplay.net…")}
						displayName={t(
							"Using our Twitch Extension for Hearthstone Deck Tracker.",
						)}
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

export default withLoading(["streams"])(translate()(StreamList));
