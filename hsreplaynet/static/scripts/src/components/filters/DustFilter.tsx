import React from "react";

interface Props {
	dust: number | null;
	setDust: (dust?: number) => any;
	maxDust?: number;
	id?: string;
	placeholder?: string;
	disabled?: boolean;
}

export default class DustFilter extends React.Component<Props> {
	static defaultProps = {
		maxDust: 50000,
		placeholder: "Dust",
	};

	public render(): React.ReactNode {
		return (
			<div className="dust-filter">
				<input
					id={this.props.id || undefined}
					type="number"
					disabled={this.props.disabled}
					step={100}
					placeholder={this.props.placeholder}
					value={this.props.dust !== Infinity ? this.props.dust : ""}
					min={0}
					max={this.props.maxDust}
					onChange={e => {
						this.props.setDust(
							e.target.value !== "" ? +e.target.value : Infinity,
						);
					}}
					className="form-control"
				/>
			</div>
		);
	}
}
