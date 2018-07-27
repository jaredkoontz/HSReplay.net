import React from "react";
import AdUnit from "./AdUnit";
import AdHelper, { showAds } from "../../AdHelper";

export default class AdContainer extends React.Component {
	private ref: HTMLDivElement;

	public componentDidMount(): void {
		window.addEventListener("resize", this.resize);
		window.requestAnimationFrame(() => this.forceUpdate());
	}

	public componentWillUnmount(): void {
		window.removeEventListener("resize", this.resize);
	}

	public render(): React.ReactNode {
		if (!showAds()) {
			return null;
		}

		const { children } = this.props;

		let maxHeight = null;
		const ids = [];
		const widths = React.Children.toArray(children).map((child: any) => {
			if (child.type !== AdUnit) {
				console.error("AdContainer expected AdUnit as child");
			}
			const [width, height] = AdUnit.parsePlaceholderSize(
				child.props.size,
			);
			if (height > maxHeight) {
				maxHeight = height;
			}
			ids.push(child.props.id);
			return width;
		});

		if (!ids.some(id => AdHelper.isAdEnabled(id))) {
			return null;
		}

		const ads = [];
		const available = this.getAvailablePixels();
		if (available) {
			let used = 0;
			for (const [index, width] of widths.entries()) {
				if (
					used + width + this.calculateMargin(ads.length + 1) >
					available
				) {
					break;
				}
				ads.push(children[index]);
				used += width;
			}

			if (!ads.length) {
				return null;
			}
		}

		return (
			<div
				ref={ref => (this.ref = ref)}
				className="ad-container ad-container--horizontal"
				style={{
					height: `${maxHeight}px`,
				}}
			>
				{ads}
			</div>
		);
	}

	private calculateMargin(elements: number): number {
		return (elements - 1) * 10;
	}

	private resize = (e: any) => {
		window.requestAnimationFrame(() => this.forceUpdate());
	};

	private getAvailablePixels(): number | null {
		if (!this.ref) {
			return null;
		}
		const { width, height } = this.ref.getBoundingClientRect();
		return width;
	}
}
