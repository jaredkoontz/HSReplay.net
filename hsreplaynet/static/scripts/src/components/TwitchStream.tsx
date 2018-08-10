import React from "react";

interface Props {
	channel: string;
	width: number;
	height: number;
	allowFullScreen?: boolean;
	muted: boolean;
	autoplay: boolean;
}

export default class TwitchStream extends React.Component<Props> {
	public render(): React.ReactNode {
		const {
			channel,
			width,
			height,
			allowFullScreen,
			muted,
			autoplay,
		} = this.props;
		return (
			<iframe
				src={`https://player.twitch.tv/?channel=${channel}&muted=${muted}&autoplay=${autoplay}`}
				height={height}
				width={width}
				frameBorder="0"
				scrolling="no"
				allowFullScreen={allowFullScreen}
			/>
		);
	}
}
