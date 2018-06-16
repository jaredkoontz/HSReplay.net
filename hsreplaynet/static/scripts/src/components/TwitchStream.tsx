import React from "react";

interface Props {
	channel: string;
	width: number;
	height: number;
	allowFullScreen?: boolean;
}

export default class TwitchStream extends React.Component<Props> {
	public render(): React.ReactNode {
		return (
			<iframe
				src={`https://player.twitch.tv/?channel=${this.props.channel}`}
				height={this.props.height}
				width={this.props.width}
				frameBorder="0"
				scrolling="no"
				allowFullScreen={this.props.allowFullScreen}
			/>
		);
	}
}
