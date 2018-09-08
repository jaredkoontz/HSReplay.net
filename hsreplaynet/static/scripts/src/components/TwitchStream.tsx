import React from "react";
import { TwitchStreamPromotionEvents } from "../metrics/Events";

interface Props {
	channel: string;
	width: number;
	height: number;
	allowFullScreen?: boolean;
	muted: boolean;
	autoplay: boolean;
}

export default class TwitchStream extends React.Component<Props> {
	private ref: React.RefObject<HTMLIFrameElement> = React.createRef();

	public componentDidMount(): void {
		window.addEventListener("blur", this.onBlur);
	}

	public componentWillUnmount(): void {
		window.removeEventListener("blur", this.onBlur);
	}

	private onBlur = () => {
		if (document.activeElement !== this.ref.current) {
			return;
		}
		TwitchStreamPromotionEvents.onFrontpageStreamInteraction(
			this.props.channel,
		);
	};

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
				ref={this.ref}
			/>
		);
	}
}
