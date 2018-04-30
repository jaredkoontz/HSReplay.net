import React from "react";
import ReactDOM from "react-dom";

interface Props {
	onClose: () => any;
}

export default class ModalScroller extends React.Component<Props> {
	private ref: HTMLDivElement;

	private close = () => {
		this.props.onClose();
	};

	private click = event => {
		if (event.target !== this.ref) {
			return;
		}
		this.close();
	};

	private keydown = event => {
		if (event.defaultPrevented) {
			return;
		}
		if (event.key !== "Escape") {
			return;
		}
		this.close();
	};

	public componentDidMount() {
		Object.assign(document.body.style, {
			overflow: "hidden",
			"margin-right": `${window.innerWidth -
				document.body.offsetWidth}px`,
		});
		document.addEventListener("keydown", this.keydown);
	}

	public componentWillUnmount(): void {
		Object.assign(document.body.style, {
			overflow: "",
			"margin-right": "",
		});
		document.removeEventListener("keydown", this.keydown);
	}

	public render(): React.ReactNode {
		let portal = document.getElementById("hsreplaynet-modal-container");
		if (!portal) {
			portal = document.createElement("div");
			portal.setAttribute("id", "hsreplaynet-modal-container");
			portal.classList.add("site-modal");
			document.body.appendChild(portal);
		}
		return ReactDOM.createPortal(
			<div className="site-modal-scroller">
				<div
					className="site-modal-container"
					onClick={this.click}
					ref={ref => (this.ref = ref)}
				>
					{this.props.children}
				</div>
			</div>,
			portal,
		);
	}
}
