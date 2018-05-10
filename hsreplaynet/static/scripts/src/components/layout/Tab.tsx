import React from "react";

interface Props {
	id: string;
	hidden?: boolean;
	disabled?: boolean;
	label?: React.ReactNode;
	highlight?: boolean;
}

export default class Tab extends React.Component<Props> {
	public render(): React.ReactNode {
		return <div>{this.props.children}</div>;
	}
}
