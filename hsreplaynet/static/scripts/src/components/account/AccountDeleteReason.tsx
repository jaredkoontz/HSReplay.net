import React from "react";

interface Props {
	value: string;
	reason: string;
}

interface State {
	checked: boolean;
}

export default class AccountDeleteReason extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			checked: false,
		};
	}

	public render(): React.ReactNode {
		return (
			<li className="radio">
				<label>
					<input
						type="radio"
						name="reason"
						value={this.props.value}
						onChange={(e: React.FormEvent<HTMLInputElement>) => {
							this.setState({
								checked:
									e.currentTarget.value === this.props.value,
							});
						}}
						required
					/>
					{this.props.reason}
				</label>
				{this.props.children && this.state.checked ? (
					<p className="alert alert-warning">{this.props.children}</p>
				) : null}
			</li>
		);
	}
}
