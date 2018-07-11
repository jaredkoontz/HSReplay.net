import React from "react";

export interface TestemonialData {
	image: string;
	name: string;
	subtitle: string;
	text: string;
}

export default class Testemonial extends React.Component<TestemonialData> {
	public render(): React.ReactNode {
		return (
			<div className="testemonial">
				<img src={this.props.image} />
				<div className="testemonial-content">
					<h2>{this.props.name}</h2>
					<h4>{this.props.subtitle}</h4>
					<p>{this.props.text}</p>
				</div>
			</div>
		);
	}
}
