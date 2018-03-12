import React from "react";
import ReactDOM from "react-dom";

interface Props {
	onClose: () => any;
}

export default class Modal extends React.Component<Props> {
	private ref: HTMLDivElement;

	private click = event => {
		if (event.target !== this.ref) {
			return;
		}
		this.props.onClose();
	};

	private keydown = event => {
		if (event.defaultPrevented) {
			return;
		}
		if (event.key !== "Escape") {
			return;
		}
		this.props.onClose();
	};

	public componentDidMount() {
		Object.assign(document.body.style, {
			overflow: "hidden",
			"margin-right": `${window.innerWidth -
				document.body.offsetWidth}px`,
		});
		document.addEventListener("keydown", this.keydown);
	}

	public componentWillUnmount() {
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
