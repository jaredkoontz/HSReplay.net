import React from "react";

interface Props {
	height: number;
}

export default class LoadingIndicator extends React.Component<Props> {
	public render(): React.ReactNode {
		return (
			<div
				className="loading-indicator"
				style={{ width: this.props.height * 7 }}
			>
				<svg viewBox="0 0 700 100">
					<circle
						className="dot dot-one"
						cx="50"
						cy="50"
						r="20"
						stroke="blue"
						fill="rgba(0, 0, 255, 0.3)"
					/>
					<circle
						className="dot dot-two"
						cx="350"
						cy="50"
						r="20"
						stroke="blue"
						fill="rgba(0, 0, 255, 0.3)"
					/>
					<circle
						className="dot dot-three"
						cx="650"
						cy="50"
						r="20"
						stroke="blue"
						fill="rgba(0, 0, 255, 0.3)"
					/>
				</svg>
			</div>
		);
	}
}
