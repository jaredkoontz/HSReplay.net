import React from "react";
import ReactDOM from "react-dom";

export type TooltipContent = React.ReactNode;

export interface ClickTouch<T> {
	click: T;
	touch: T;
}

interface Props {
	belowCursor?: boolean;
	centered?: boolean;
	className?: string;
	content?: TooltipContent | ClickTouch<TooltipContent>;
	header?: string;
	id?: string;
	noBackground?: boolean;
	simple?: boolean;
	yOffset?: number;
	xOffset?: number;
	onHovering?: () => void;
	noSrTooltip?: boolean;
}

interface State {
	hovering: boolean;
	clientX: number;
	clientY: number;
	isTouchDevice: boolean;
}

export default class Tooltip extends React.Component<Props, State> {
	tooltip: HTMLDivElement | null = null;

	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			clientX: 0,
			clientY: 0,
			hovering: false,
			isTouchDevice: false,
		};
	}

	private renderTooltip(): React.ReactNode {
		if (!this.state.hovering) {
			return;
		}

		let portal = document.getElementById("hsreplaynet-tooltip-container");
		if (!portal) {
			portal = document.createElement("div");
			portal.setAttribute("id", "hsreplaynet-tooltip-container");
			document.body.appendChild(portal);
		}

		const classNames = ["hsreplay-tooltip"];
		if (this.props.noBackground) {
			classNames.push("no-background");
		}
		if (this.props.simple) {
			classNames.push("simple-tooltip");
		}

		const style = {};
		let height = 0;
		if (this.tooltip) {
			height = this.tooltip.getBoundingClientRect().height;
			let top = this.state.clientY;
			if (!this.props.belowCursor) {
				top -= height;
			}
			top += this.props.yOffset || 0;
			style["top"] = Math.min(
				window.innerHeight - height,
				Math.max(0, top),
			);
		} else {
			style["visibility"] = "hidden";
		}
		if (this.tooltip && this.props.centered) {
			const width = this.tooltip.getBoundingClientRect().width;
			style["left"] = Math.min(
				window.innerWidth - width,
				Math.max(0, this.state.clientX - width / 2),
			);
		} else if (this.state.clientX < window.innerWidth / 2) {
			style["left"] = this.state.clientX + 20 + (this.props.xOffset || 0);
		} else {
			style["right"] =
				window.innerWidth -
				this.state.clientX +
				(this.props.xOffset || 0);
		}

		let body = null;
		if (this.props.content) {
			const selectedContent = Tooltip.getSelectedContent(
				this.props.content,
				this.state.isTouchDevice,
			);
			if (typeof selectedContent === "string") {
				body = <p>{selectedContent}</p>;
			} else {
				body = selectedContent;
			}
		}

		return ReactDOM.createPortal(
			<div
				id={this.props.id}
				className={classNames.join(" ")}
				style={style}
				ref={ref => (this.tooltip = ref)}
				role="tooltip"
			>
				{this.props.header ? <h4>{this.props.header}</h4> : null}
				{body}
			</div>,
			portal,
		);
	}

	public render(): React.ReactNode {
		const classNames = ["tooltip-wrapper"];
		if (this.props.className) {
			classNames.push(this.props.className);
		}

		const cancel = () => {
			this.tooltip = undefined;
			this.setState({ hovering: false });
		};

		const hover = e => {
			if (!this.state.hovering && this.props.onHovering) {
				this.props.onHovering();
			}
			this.setState({
				hovering: true,
				clientX: e.clientX,
				clientY: e.clientY,
			});
		};

		let content = null;
		if (this.props.content) {
			const selectedContent = Tooltip.getSelectedContent(
				this.props.content,
				this.state.isTouchDevice,
			);
			if (typeof selectedContent === "string") {
				content = <p>{selectedContent}</p>;
			} else {
				content = selectedContent;
			}
		}

		return (
			<div
				className={classNames.join(" ")}
				onMouseMove={hover}
				onMouseLeave={cancel}
				onTouchStart={() => this.setState({ isTouchDevice: true })}
			>
				{!this.props.noSrTooltip ? (
					<section className="sr-only">
						{this.props.header ? (
							<h4>{this.props.header}</h4>
						) : null}
						{content}
					</section>
				) : null}
				{this.renderTooltip()}
				{this.props.children}
			</div>
		);
	}

	protected static getSelectedContent(
		content: TooltipContent | ClickTouch<TooltipContent>,
		isTouchDevice: boolean,
	): TooltipContent {
		if (typeof content !== "object") {
			return content;
		}

		if (
			!content.hasOwnProperty("click") &&
			!content.hasOwnProperty("touch")
		) {
			return content as TooltipContent;
		}

		// switch based on type
		return content[isTouchDevice ? "touch" : "click"];
	}
}
