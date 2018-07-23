import React from "react";
import UserData from "../UserData";
import { NitropayCreateAdOptions } from "../interfaces";

interface Props {
	id: string;
	size: [number, number];
	customOptions?: NitropayCreateAdOptions;
}

export default class AdUnit extends React.Component<Props> {
	public render(): React.ReactNode {
		if (!this.isVisible()) {
			return null;
		}

		const [width, height] = this.getPlaceholderSize();
		return (
			<div
				id={this.props.id}
				style={{
					width: `${width}px`,
					height: `${height}px`,
					border: "solid 1px black",
					// placeholder color
					background: "magenta",
				}}
			/>
		);
	}

	public componentDidMount(): void {
		if (this.isVisible()) {
			this.loadExternalAd();
		}
	}

	private getPlaceholderSize(): [number, number] {
		return this.props.size;
	}

	private isVisible(): boolean {
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
