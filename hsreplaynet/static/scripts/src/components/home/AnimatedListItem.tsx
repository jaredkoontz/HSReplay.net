import React from "react";

interface Props {
	index: number;
	height: number;
	key: any;
}

export default class AnimatedListItem extends React.Component<Props> {
	public render(): React.ReactNode {
		const { height, index } = this.props;
		return (
			<div
				className="animated-list-item"
				style={{ top: height * index }}
				key={this.props.key}
			>
				{this.props.children}
			</div>
		);
	}
}
