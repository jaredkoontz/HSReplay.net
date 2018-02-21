import React from "react";

interface Props {
	data?: any;
	p?: boolean;
}

export default class DataText extends React.Component<Props> {
	public render(): React.ReactNode {
		if (typeof this.props.p !== "undefined" && !this.props.p) {
			return <span>{this.props.data}</span>;
		}
		return <p>{this.props.data}</p>;
	}
}
