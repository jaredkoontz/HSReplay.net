import React from "react";

export default class NoDecksMessage extends React.Component {
	public render(): React.ReactNode {
		return (
			<div className="message-wrapper">
				<h2>No decks found</h2>
				{this.props.children}
			</div>
		);
	}
}
