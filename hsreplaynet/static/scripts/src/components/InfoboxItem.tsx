import React from "react";

interface Props {
	header: string;
	value?: any;
}

export default class InfoboxItem extends React.Component<Props> {
	public render(): React.ReactNode {
		return (
			<li>
				{this.props.header}
				<span className="infobox-value">{this.props.value}</span>
			</li>
		);
	}
}
