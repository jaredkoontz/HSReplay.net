import React from "react";
import { withLoading } from "./loading/Loading";
import { Archetype, TwitchVodData } from "../utils/api";
import { InjectedTranslateProps, translate } from "react-i18next";
import TwitchEmbed from "../components/TwitchEmbed";
import TwitchVodsTable from "./TwitchVodsTable";
import CardData from "../CardData";

interface Props extends InjectedTranslateProps {
	archetypeData?: Archetype[];
	vods?: TwitchVodData[];
	gameType: string;
	cardData: CardData;
}

interface State {
	currentVodUrl: string;
}

class TwitchVods extends React.Component<Props, State> {
	private container: HTMLDivElement | null = null;
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			currentVodUrl: props.vods[0].url,
		};
	}

	public componentDidMount(): void {
		window.addEventListener("resize", this.resize);
	}

	public componentWillUnmount(): void {
		window.removeEventListener("resize", this.resize);
	}

	private resize = () => {
		window.requestAnimationFrame(() => {
			this.forceUpdate();
		});
	};

	private selectVod = (vod: TwitchVodData) => {
		this.setState({ currentVodUrl: vod.url });
	};

	public render(): React.ReactNode {
		const { t, vods } = this.props;
		const selectedVod =
			this.state.currentVodUrl &&
			vods.find(vod => vod.url === this.state.currentVodUrl);
		let streamWidth = 0;
		if (this.container !== null) {
			const containerWidth = this.container.getBoundingClientRect().width;
			streamWidth = Math.min(containerWidth, 800);
		}
		const streamHeight = streamWidth * 9 / 16;

		return (
			<div
				className="twitch-vod-container"
				ref={ref => {
					const containerWasNull = this.container === null;
					this.container = ref;
					if (containerWasNull) {
						window.requestAnimationFrame(() => {
							this.forceUpdate();
						});
					}
				}}
			>
				<div className="twitch-vod-main">
					<div className="twitch-iframe-container">
						<TwitchEmbed
							video={selectedVod}
							width={streamWidth}
							height={streamHeight}
							muted={false}
							autoplay
							allowFullScreen
						/>
					</div>
				</div>
				<TwitchVodsTable
					archetypeData={this.props.archetypeData}
					cardData={this.props.cardData}
					gameType={this.props.gameType}
					vods={this.props.vods}
					selectedVod={
						this.state.currentVodUrl
							? this.props.vods.find(
									vod => vod.url === this.state.currentVodUrl,
							  )
							: null
					}
					onSelectVod={this.selectVod}
				/>
			</div>
		);
	}
}

export default withLoading(["vods", "archetypeData"])(translate()(TwitchVods));
