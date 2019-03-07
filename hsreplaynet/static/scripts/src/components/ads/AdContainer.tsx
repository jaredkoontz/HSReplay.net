import React from "react";
import NitropayAdUnit from "./NitropayAdUnit";
import AdHelper, { showAds } from "../../AdHelper";
import { parsePlaceholderSize } from "./NitropayAdUnit";
import UserData from "../../UserData";

interface Props {}

interface State {
	mobileView: boolean;
}

const MOBILE_WIDTH = 768;

export default class AdContainer extends React.Component<Props, State> {
	private ref: HTMLDivElement;

	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			mobileView: window.innerWidth <= MOBILE_WIDTH,
		};
	}

	public componentDidMount(): void {
		window.addEventListener("resize", this.resize);
		window.requestAnimationFrame(() => this.forceUpdate());
	}

	public componentWillUnmount(): void {
		window.removeEventListener("resize", this.resize);
	}

	public render(): React.ReactNode {
		if (UserData.hasFeature("networkn")) {
			console.warn("AdContainer does not support NetworkN Ad Units!");
			return null;
		}

		if (!showAds() || this.state.mobileView) {
			return null;
		}

		const { children } = this.props;

		let maxHeight = null;
		const ids = [];
		const widths = React.Children.toArray(children).map((child: any) => {
			if (child.type !== NitropayAdUnit) {
				console.error("AdContainer expected NitropayAdUnit as child");
			}
			const [width, height] = parsePlaceholderSize(child.props.size);
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
		let mobileView: boolean | null = null;
		const width = window.innerWidth;
		if (this.state.mobileView && width > MOBILE_WIDTH) {
			mobileView = false;
		} else if (!this.state.mobileView && width <= MOBILE_WIDTH) {
			mobileView = true;
		}
		if (mobileView != null) {
			this.setState({ mobileView }, () => {
				window.requestAnimationFrame(() => this.forceUpdate());
			});
		} else {
			window.requestAnimationFrame(() => this.forceUpdate());
		}
	};

	private getAvailablePixels(): number | null {
		if (!this.ref) {
			return null;
		}
		const { width } = this.ref.getBoundingClientRect();
		return width;
	}
}
