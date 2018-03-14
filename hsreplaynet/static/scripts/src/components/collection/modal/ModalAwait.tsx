import React from "react";

export default class ModalAwait extends React.Component {
	public render(): React.ReactNode {
		return (
			<p className="modal-await">
				<span className="glyphicon glyphicon-repeat glyphicon-spin" />
				Waiting for {this.props.children}…
			</p>
		);
	}
}
