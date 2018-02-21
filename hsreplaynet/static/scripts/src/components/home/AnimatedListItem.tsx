import React from "react";
import CardTile from "../CardTile";

interface Props {
	index: number;
	height: number;
}

export default class AnimatedListItem extends React.Component<Props> {
	public render(): React.ReactNode {
		const { height, index } = this.props;
		return (
			<div className="animated-list-item" style={{ top: height * index }}>
				{this.props.children}
			</div>
		);
	}
}
