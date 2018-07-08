import React from "react";
import Panel from "../Panel";

interface Props {
	title: string;
	image: string | React.ReactNode;
	subtitle: string;
	text?: string | React.ReactNode;
	bullets?: string[];
}

export default class PremiumFeaturePanel extends React.Component<Props> {
	public render(): React.ReactNode {
		return (
			<Panel
				header={this.props.title}
				theme="light"
				accent="blue"
				className="premium-feature-panel"
			>
				<div className="image-container">
					{typeof this.props.image === "string" ? (
						<img src={this.props.image} />
					) : (
						this.props.image
					)}
				</div>
				<h3>{this.props.subtitle}</h3>
				<div className="content-container">
					{this.props.text ? <p>{this.props.text}</p> : null}
					{this.props.bullets ? (
						<div className="list-container">
							<ul>{this.props.bullets.map(x => <li>{x}</li>)}</ul>
						</div>
					) : null}
				</div>
			</Panel>
		);
	}
}
