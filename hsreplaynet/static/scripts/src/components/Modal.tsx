import React from "react";
import { Provider as ModalProvider } from "./utils/modal";
import ModalScroller from "./modal/ModalScroller";

interface Props {
	visible: boolean;
	onClose: () => void;
}

export default class Modal extends React.Component<Props> {
	private close = () => {
		this.props.onClose();
	};

	public render(): React.ReactNode {
		if (!this.props.visible) {
			return null;
		}
		return (
			<ModalScroller onClose={this.props.onClose}>
				<ModalProvider
					value={{
						onClose: this.close,
					}}
				>
					{this.props.children}
				</ModalProvider>
			</ModalScroller>
		);
	}
}
