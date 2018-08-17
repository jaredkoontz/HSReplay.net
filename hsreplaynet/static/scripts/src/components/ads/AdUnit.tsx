import React from "react";
import { NitropayCreateAdOptions } from "../../interfaces";
import AdHelper, { debugAds, showAds } from "../../AdHelper";
import { fetchCSRF } from "../../helpers";

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

interface State {
	enabled: boolean;
	working: boolean;
	loaded?: boolean;
	mobileView: boolean;
}

const MOBILE_WIDTH = 768;

export default class AdUnit extends React.Component<Props, State> {
	private ref: HTMLElement | null = null;

	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			enabled: AdHelper.isAdEnabled(props.id, true),
			working: false,
			mobileView: window.innerWidth <= MOBILE_WIDTH,
			loaded: false,
		};
	}

	public render(): React.ReactNode {
		if (
			!showAds() ||
			!AdHelper.isAdEnabled(this.props.id) ||
			this.state.mobileView !== !!this.props.mobile
		) {
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
				ref={ref => (this.ref = ref)}
				key={this.props.id}
			>
				{debugAds() ? (
					<div
						className={
							"ad-unit-debug" +
							(this.state.working ? " disabled" : "")
						}
						style={{
							background: this.state.enabled
								? "green"
								: "darkred",
						}}
						onClick={this.onAdDebugClick}
					>
						<input
							className="debug-checkbox"
							type="checkbox"
							checked={this.state.enabled}
						/>
						<p>{this.props.id}</p>
						<p>{this.props.size}</p>
					</div>
				) : null}
			</div>
		);
	}

	private onAdDebugClick = (event: any) => {
		event.preventDefault();
		this.setState({ working: true });
		const headers = new Headers();
		headers.set("content-type", "application/json");
		fetchCSRF(`/api/v1/ads/${this.props.id}/`, {
			body: JSON.stringify({ enabled: !this.state.enabled }),
			credentials: "same-origin",
			headers,
			method: "PATCH",
		})
			.then((response: Response) => {
				const newState = { working: false };
				if (!response.ok) {
					console.error(response.toString());
				} else {
					newState["enabled"] = !this.state.enabled;
				}
				this.setState(newState);
			})
			.catch(reason => {
				console.error(reason);
				this.setState({ working: false });
			});
	};

	public componentDidMount(): void {
		this.loadExternalAd();
		window.addEventListener("resize", this.resize);
	}

	private resize = () => {
		let mobileView: boolean | null = null;
		const width = window.innerWidth;
		if (this.state.mobileView && width > MOBILE_WIDTH) {
			mobileView = false;
		} else if (!this.state.mobileView && width <= MOBILE_WIDTH) {
			mobileView = true;
		}
		if (mobileView != null) {
			this.setState({ mobileView }, () => this.loadExternalAd());
		} else {
			this.loadExternalAd();
		}
	};

	public componentWillUnmount(): void {
		window.removeEventListener("resize", this.resize);
	}

	public static parsePlaceholderSize(size: string): [number, number] {
		const [width, height] = size.split("x").map(Number);
		return [width, height];
	}

	private loadExternalAd(): boolean {
		if (this.state.loaded) {
			// ad has already been loaded
			return;
		}

		if (!window.nads) {
			// Nitropay did not load properly or was blocked
			return;
		}

		if (!showAds() || debugAds() || !AdHelper.isAdEnabled(this.props.id)) {
			return;
		}

		if (this.ref && this.ref.offsetParent === null) {
			// ad is not actually visibile
			return;
		}

		// defaultOptions
		const options = {
			floor: 0.2,
			refreshLimit: 10,
			refreshTime: 90,
			sizes: [AdUnit.parsePlaceholderSize(this.props.size)],
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

		this.setState({ loaded: true });
	}
}
