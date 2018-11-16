import React from "react";

interface Props {
	default: string | null;
	options: { [key: string]: React.ReactNode };
	value: string | null;
	onSelect: (key: string | null) => void;
	defaultKey: string | null;
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
		const { value, defaultKey } = this.props;
		if (value !== null && value !== defaultKey) {
			classNames.push("active");
		}
		const selectedValue = value || defaultKey;
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
					{Object.entries(this.props.options).map(([k, v]) => {
						return (
							<option key={k} value={k}>
								{v}
							</option>
						);
					})}
				</select>
				<span className="caret" />
			</div>
		);
	}

	private onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		this.props.onSelect(event.target.value);
	};
}
