import React from "react";
import { commaSeparate } from "../helpers";
import { TwitchStreamPromotionEvents } from "../metrics/GoogleAnalytics";

interface Props {
	url?: string;
	displayName?: string;
	thumbnailUrl?: string;
	thumbnailWidth: number;
	thumbnailHeight: number;
	target?: string;
	title?: string;
	viewerCount?: number | string;
	noMetrics?: boolean;
}

export default class StreamThumbnail extends React.Component<Props> {
	static defaultProps = {
		target: "_blank"
	};

	visitStream = (event: React.MouseEvent<HTMLAnchorElement>): void => {
		if (this.props.noMetrics) {
			return;
		}
		TwitchStreamPromotionEvents.onVisitStream(this.props.displayName, {
			transport: "beacon"
		});
	};

	public render(): React.ReactNode {
		let thumbnail = null;
		if (this.props.thumbnailUrl) {
			const thumbnail_url = this.props.thumbnailUrl
				.replace("{width}", "" + this.props.thumbnailWidth)
				.replace("{height}", "" + this.props.thumbnailHeight);
			thumbnail = (
				<img
					src={thumbnail_url}
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
								this.props.thumbnailHeight)}%`
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
			viewers = (
				<span>
					{commaSeparate(this.props.viewerCount)}{" "}
					{this.props.viewerCount === 1 ? "viewer" : "viewers"}
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
