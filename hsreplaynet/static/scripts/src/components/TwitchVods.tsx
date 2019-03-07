import React from "react";
import { withLoading } from "./loading/Loading";
import { Archetype, TwitchVodData } from "../utils/api";
import { WithTranslation, withTranslation } from "react-i18next";
import TwitchEmbed from "./TwitchEmbed";
import TwitchVodsTable from "./TwitchVodsTable";
import CardData from "../CardData";
import NitropayAdUnit from "./ads/NitropayAdUnit";
import Fragments from "./Fragments";
import NetworkNAdUnit from "./ads/NetworkNAdUnit";

interface Props extends WithTranslation {
	archetypeData?: Archetype[];
	vods?: TwitchVodData[];
	gameType: string;
	cardData: CardData;
	autoplay: boolean;
}

interface WrapperProps {
	width: number;
	height: number;
	vodId?: string;
	setVodId?: (vodId: string) => void;
	vods?: TwitchVodData[];
	autoplay: boolean;
}

class TwitchEmbedWrapper extends React.Component<WrapperProps> {
	public render(): React.ReactNode {
		const video = this.props.vods.find(
			x => x.replay_shortid === this.props.vodId,
		);
		if (!this.props.vods || !video) {
			return null;
		}
		return (
			<TwitchEmbed
				video={video}
				width={this.props.width}
				height={this.props.height}
				muted={false}
				autoplay={this.props.autoplay}
				allowFullScreen
			/>
		);
	}
}

class TwitchVods extends React.Component<Props> {
	private container: HTMLDivElement | null = null;

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

	public render(): React.ReactNode {
		const { t, vods } = this.props;
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
						<Fragments
							defaults={{
								vodId: "",
							}}
						>
							<TwitchEmbedWrapper
								width={streamWidth}
								height={streamHeight}
								vods={this.props.vods}
								autoplay={this.props.autoplay}
							/>
						</Fragments>
					</div>
					<div className="vod-ad-container">
						<NitropayAdUnit id="dd-v-1" size="728x90" />
						<NetworkNAdUnit id="nn_bb2" center />
					</div>
				</div>
				<Fragments
					defaults={{
						vodsSortBy: "rank",
						vodsSortDirection: "ascending",
						vodsResult: "won",
						vodsOpponent: "any",
						vodsFirst: "any",
						vodId: "",
					}}
				>
					<TwitchVodsTable
						archetypeData={this.props.archetypeData}
						cardData={this.props.cardData}
						gameType={this.props.gameType}
						vods={this.props.vods}
						pageSize={8}
					/>
				</Fragments>
			</div>
		);
	}
}

export default withLoading(["vods", "archetypeData"])(
	withTranslation()(TwitchVods),
);
