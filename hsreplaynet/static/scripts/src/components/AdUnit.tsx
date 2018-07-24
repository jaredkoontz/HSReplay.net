import React from "react";
import UserData from "../UserData";
import { NitropayCreateAdOptions } from "../interfaces";

export type AdUnitSize =
	| "300x250"
	| "728x90"
	| "320x50"
	| "160x600"
	| "300x600"
	| "970x90"
	| "970x250";

interface Props {
	id: string;
	size: AdUnitSize;
	customOptions?: NitropayCreateAdOptions;
	mobile?: boolean;
}

export default class AdUnit extends React.Component<Props> {
	public render(): React.ReactNode {
		if (!this.isVisible()) {
			return null;
		}

		const classNames = ["ad-unit"];
		classNames.push(
			this.props.mobile ? "ad-unit--mobile" : "ad-unit--desktop",
		);

		const [width, height] = AdUnit.parsePlaceholderSize(this.props.size);

		return (
			<div
				id={this.props.id}
				className={classNames.join(" ")}
				style={{
					width: `${width}px`,
					height: `${height}px`,
				}}
				key={this.props.id}
			>
				{this.debugMode() ? (
					<p
						style={{
							lineHeight: `${height}px`,
							textAlign: "center",
							fontWeight: "bold",
						}}
					>
						{this.props.id}
					</p>
				) : null}
			</div>
		);
	}

	public componentDidMount(): void {
		if (this.isVisible() && !this.debugMode()) {
			this.loadExternalAd();
		}
	}

	public static parsePlaceholderSize(size: string): [number, number] {
		const [width, height] = size.split("x").map(Number);
		return [width, height];
	}

	private debugMode(): boolean {
		return UserData.hasFeature("ads-debug");
	}

	private isVisible(): boolean {
		// always render ads if in debug mode
		if (this.debugMode()) {
			return true;
		}
		// do not render for users outside of feature group
		if (!UserData.hasFeature("ads")) {
			return false;
		}

		// do not render for Premium users
		if (UserData.isPremium()) {
			return false;
		}

		return true;
	}

	private loadExternalAd(): boolean {
		if (!window.nads) {
			// Nitropay did not load properly or was blocked
			return;
		}

		// defaultOptions
		const options = {
			floor: 0.05,
			refreshLimit: 10,
			refreshTime: 90,
			report: {
				enabled: true,
				wording: "Report Ad",
				position: "fixed-bottom-right",
			},
		};

		// use custom options
		if (typeof this.props.customOptions === "object") {
			Object.assign(options, this.props.customOptions);
		}

		// initialize ad
		window.nads.createAd(this.props.id, options);
	}
}
