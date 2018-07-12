import React from "react";

export interface TestimonialData {
	image: string;
	name: string;
	subtitle: string;
	text: string;
}

export default class Testimonial extends React.Component<TestimonialData> {
	public render(): React.ReactNode {
		return (
			<div className="testimonial">
				<img src={this.props.image} />
				<div className="testimonial-content">
					<h2>{this.props.name}</h2>
					<h4>{this.props.subtitle}</h4>
					<p>{this.props.text}</p>
				</div>
			</div>
		);
	}
}
