import React from "react";
import AdUnit from "./AdUnit";

interface Props {}

interface State {
	measured: boolean;
}

export default class AdContainer extends React.Component<Props, State> {
	private ref: HTMLDivElement;

	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			measured: false,
		};
	}

	public componentDidMount(): void {
		window.addEventListener("resize", this.resize);
	}

	public componentWillUnmount(): void {
		window.removeEventListener("resize", this.resize);
	}

	public componentDidUpdate(): void {
		if (!this.state.measured) {
			this.setState({ measured: true });
		}
	}

	public render(): React.ReactNode {
		const { children } = this.props;

		let maxHeight = null;
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
			return width;
		});

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
