import React from "react";
import { commaSeparate } from "../helpers";
import { TwitchStreamPromotionEvents } from "../metrics/GoogleAnalytics";
import { BnetGameType } from "../hearthstone";
import RankIcon from "./RankIcon";
import { InjectedTranslateProps, translate } from "react-i18next";

interface Props extends InjectedTranslateProps {
	url?: string;
	displayName?: string;
	thumbnailUrl?: string;
	thumbnailWidth: number;
	thumbnailHeight: number;
	target?: string;
	title?: string;
	viewerCount?: number | string;
	gameType?: BnetGameType;
	rank?: number;
	legendRank?: number;
	noMetrics?: boolean;
}

class StreamThumbnail extends React.Component<Props> {
	static defaultProps = {
		target: "_blank",
	};

	visitStream = (event: React.MouseEvent<HTMLAnchorElement>): void => {
		if (this.props.noMetrics) {
			return;
		}
		TwitchStreamPromotionEvents.onVisitStream(this.props.displayName, {
			transport: "beacon",
		});
	};

	public render(): React.ReactNode {
		const { t } = this.props;
		let thumbnail = null;
		if (this.props.thumbnailUrl) {
			const thumbnailUrl = this.props.thumbnailUrl
				.replace("{width}", "" + this.props.thumbnailWidth)
				.replace("{height}", "" + this.props.thumbnailHeight);
			thumbnail = (
				<img
					src={thumbnailUrl}
					alt={this.props.displayName}
					height={this.props.thumbnailHeight}
					width={this.props.thumbnailWidth}
				/>
			);
		} else {
			thumbnail = (
				<div
					className={"stream-thumbnail-default-image"}
					style={{
						paddingBottom: `${100 /
							(this.props.thumbnailWidth /
								this.props.thumbnailHeight)}%`,
					}}
				>
					<div>
						<span className="glyphicon glyphicon-plus" />
					</div>
				</div>
			);
		}

		let viewers = null;
		if (this.props.viewerCount !== undefined) {
			const viewerCount = commaSeparate(this.props.viewerCount);
			viewers = (
				<span>
					{t(
						"{viewerCount, plural, one {# viewer} other {# viewers}}",
						{ viewerCount },
					)}
				</span>
			);
		}

		return (
			<a
				className="stream-thumbnail"
				href={this.props.url}
				target={this.props.target}
				onClick={this.visitStream}
			>
				<figure>
					{thumbnail}
					<aside>
						<RankIcon
							gameType={this.props.gameType}
							rank={this.props.rank}
							legendRank={this.props.legendRank}
						/>
					</aside>
					<figcaption>
						<strong title={this.props.title}>
							{this.props.title}
						</strong>
						{viewers}
						{this.props.displayName}
					</figcaption>
				</figure>
			</a>
		);
	}
}

export default translate()(StreamThumbnail);
