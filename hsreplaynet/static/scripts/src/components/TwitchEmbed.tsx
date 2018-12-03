import React from "react";
import {
	TwitchStreamPromotionEvents,
	TwitchVodEvents,
} from "../metrics/Events";
import { TwitchVodData } from "../utils/api";

interface Props {
	channel?: string;
	video?: TwitchVodData;
	width: number;
	height: number;
	allowFullScreen?: boolean;
	muted: boolean;
	autoplay: boolean;
	style?: any;
}

export default class TwitchEmbed extends React.Component<Props> {
	private ref: React.RefObject<HTMLIFrameElement> = React.createRef();

	public componentDidMount(): void {
		window.addEventListener("blur", this.onBlur);
		if (this.props.video) {
			TwitchVodEvents.onVodLoaded(this.props.video.url);
		}
	}

	public componentWillUnmount(): void {
		window.removeEventListener("blur", this.onBlur);
	}

	public componentDidUpdate(prevProps: Props) {
		const { video } = this.props;
		const prevVideo = prevProps.video;
		if (video && (!prevVideo || prevVideo.url !== video.url)) {
			TwitchVodEvents.onVodLoaded(this.props.video.url);
		}
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
			video,
			style,
		} = this.props;
		const controlParams = `muted=${muted}&autoplay=${autoplay}`;
		let src = null;
		if (video) {
			const vodRegex = /\/videos\/(\d+)\?t=([\dhms]+)/;
			const match = vodRegex.exec(video.url);
			if (match === null) {
				return null;
			}
			src = `https://player.twitch.tv/?video=v${match[1]}&t=${
				match[2]
			}&${controlParams}`;
		} else {
			src = `https://player.twitch.tv/?channel=${channel}&${controlParams}`;
		}
		return (
			<iframe
				src={src}
				height={height}
				width={width}
				frameBorder="0"
				scrolling="no"
				allowFullScreen={allowFullScreen}
				ref={this.ref}
				style={style}
			/>
		);
	}
}
