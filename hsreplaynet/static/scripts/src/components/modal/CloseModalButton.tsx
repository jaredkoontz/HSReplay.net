import React from "react";
import { Consumer as ModalConsumer } from "../utils/modal";

export default class CloseModalButton extends React.Component {
	public render(): React.ReactNode {
		return (
			<ModalConsumer>
				{({ onClose }) => (
					<span
						onClick={() => onClose()}
						aria-label="Close"
						className="modal-close"
					>
						&times;
					</span>
				)}
			</ModalConsumer>
		);
	}
}
