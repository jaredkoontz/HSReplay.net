import React from "react";

export const enum BarDirection {
	VERTICAL,
	HORIZONTAL
}

interface Props {
	total: number;
	value: number;
	valueElement?: JSX.Element;
	label?: string;
	direction?: BarDirection;
}

export default class Bar extends React.Component<Props> {
	public render(): React.ReactNode {
		const direction = this.props.direction || BarDirection.VERTICAL;
		const style = {};

		const size = `${100 / this.props.total * this.props.value}%`;
		style[
			direction === BarDirection.HORIZONTAL ? "width" : "height"
		] = size;

		const valueElement = this.props.valueElement || (
			<div className="bar-label">{this.props.label}</div>
		);

		return (
			<div
				className={`bar bar-${
					direction === BarDirection.HORIZONTAL
						? "horizontal"
						: "vertical"
				}`}
			>
				<div className="bar-body">
					<div style={style} />
				</div>
				{valueElement}
			</div>
		);
	}
}
