import React from "react";

interface Props {
	condition: boolean;
}

export default class Conditional extends React.Component<Props> {
	public render(): React.ReactNode {
		if (this.props.condition) {
			return React.Children.only(this.props.children);
		}
		return null;
	}
}
