import React from "react";

interface Props {
	header: string;
	subtitle: string;
	highlight: React.ReactNode | string;
}

export default class ProfileHighlight extends React.Component<Props> {
	public render(): React.ReactNode {
		let { highlight } = this.props;
		if (typeof highlight === "string") {
			highlight = <p>{highlight}</p>;
		}
		return (
			<div className="profile-highlight">
				<div className="profile-highlight-content">
					<div>{highlight}</div>
				</div>
				<div className="profile-highlight-text">
					<div>
						<h4>{this.props.header}</h4>
						<p>{this.props.subtitle}</p>
					</div>
				</div>
			</div>
		);
	}
}
