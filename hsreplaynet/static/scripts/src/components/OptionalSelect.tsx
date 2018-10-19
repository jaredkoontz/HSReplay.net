import React from "react";

interface Props {
	default: string | null;
	options: { [key: string]: React.ReactNode };
	value: string | null;
	onSelect: (key: string | null) => void;
	defaultKey?: string;
	id?: string;
	className?: string;
}

export default class OptionalSelect extends React.Component<Props> {
	static defaultProps = {
		defaultKey: "default",
	};

	render(): React.ReactNode {
		const classNames = ["optional-select"];
		if (this.props.className) {
			classNames.push(this.props.className);
		}
		const active = this.props.value !== null;
		if (active) {
			classNames.push("active");
		}
		const selectedValue =
			this.props.value !== null
				? this.props.value
				: this.props.defaultKey;
		return (
			<div className={classNames.join(" ")}>
				<select
					onChange={this.onChange}
					id={this.props.id}
					value={selectedValue}
				>
					<option value={this.props.defaultKey}>
						{this.props.default}
					</option>
					{Object.entries(this.props.options).map(([key, value]) => {
						return (
							<option key={key} value={key}>
								{value}
							</option>
						);
					})}
				</select>
				<span className="caret" />
			</div>
		);
	}

	private onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const key = event.target.value;
		if (key === this.props.defaultKey) {
			this.props.onSelect(null);
			return;
		}
		this.props.onSelect(key);
	};
}
