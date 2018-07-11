import React from "react";
import Panel from "../Panel";

interface Props {
	title: string;
	image: string | React.ReactNode;
	subtitle: string;
	text?: string | React.ReactNode;
	bullets?: string[];
	wide?: boolean;
}

export default class PremiumFeaturePanel extends React.Component<Props> {
	public render(): React.ReactNode {
		const className = ["premium-feature-panel"];
		if (this.props.wide) {
			className.push("wide");
		}

		let text = null;
		if (this.props.text) {
			text = this.props.text;
			if (typeof this.props.text === "string") {
				text = <p>{text}</p>;
			}
		}

		return (
			<Panel
				header={this.props.title}
				theme="light"
				accent="blue"
				className={className.join(" ")}
			>
				<div className="image-container">
					{typeof this.props.image === "string" ? (
						<img src={this.props.image} />
					) : (
						this.props.image
					)}
				</div>
				<div className="content-container">
					<h3>{this.props.subtitle}</h3>
					<div className="text-container">
						{text}
						{this.props.bullets ? (
							<div className="list-container">
								<ul>
									{this.props.bullets.map(x => <li>{x}</li>)}
								</ul>
							</div>
						) : null}
					</div>
				</div>
			</Panel>
		);
	}
}
