import React from "react";
import { image } from "../helpers";

interface Props {
	autoplay?: boolean;
	autoplayDelay?: number;
}

interface State {
	videoLoaded: boolean;
	videoPlaying: boolean;
	loadVideo: boolean;
}

export default class HDTVideo extends React.Component<Props, State> {
	private video: HTMLVideoElement;

	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			videoLoaded: false,
			videoPlaying: false,
			loadVideo: false,
		};
	}

	componentDidMount() {
		if (this.props.autoplay && this.props.autoplayDelay) {
			setTimeout(
				() => this.setState({ loadVideo: true }),
				this.props.autoplayDelay,
			);
		}
	}

	componentDidUpdate(prevProps: Props, prevState: State) {
		if (!prevState.videoPlaying && this.state.videoPlaying && this.video) {
			this.video.play();
		}
	}

	public render(): React.ReactNode {
		const video = this.state.loadVideo ? (
			<video
				key="video"
				ref={ref => (this.video = ref)}
				muted
				onLoadedData={() =>
					this.setState({ videoLoaded: true, videoPlaying: true })
				}
				onEnded={() => this.setState({ videoPlaying: false })}
			>
				<source
					src="https://s3.amazonaws.com/media.hearthsim.net/hsreplaynet/hdt-preview.webm"
					type="video/webm"
				/>
				<source
					src="https://s3.amazonaws.com/media.hearthsim.net/hsreplaynet/hdt-preview.mp4"
					type="video/mp4"
				/>
			</video>
		) : null;
		const videoThumbnail = (
			<img
				key="thumbnail"
				src={image("hdt-preview-stopthumb.jpg")}
				onMouseEnter={() => {
					this.setState({ videoPlaying: true, loadVideo: true });
				}}
			/>
		);
		return (
			<div className="video-container">
				{this.state.videoLoaded && this.state.videoPlaying
					? [video, videoThumbnail]
					: [videoThumbnail, video]}
			</div>
		);
	}
}
