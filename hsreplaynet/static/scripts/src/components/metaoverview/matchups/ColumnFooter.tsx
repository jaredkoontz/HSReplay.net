import React from "react";
import _ from "lodash";
import Bar, { BarDirection } from "./Bar";
import { formatNumber } from "../../../i18n";

interface Props {
	weight: number;
	editable?: boolean;
	onWeightChanged?: (popularity: number) => void;
	highlight?: boolean;
	max?: number;
	style?: React.CSSProperties;
}

interface State {
	text: string | null;
}

export default class ColumnFooter extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			text: this.props.editable ? "" + props.weight : null,
		};
	}

	public shouldComponentUpdate(
		nextProps: Readonly<Props>,
		nextState: Readonly<State>,
		nextContext: any,
	): boolean {
		return (
			this.props.highlight !== nextProps.highlight ||
			this.props.max !== nextProps.max ||
			this.props.weight !== nextProps.weight ||
			this.props.editable !== nextProps.editable ||
			!_.isEqual(this.props.style, nextProps.style) ||
			this.state.text !== nextState.text
		);
	}

	private onChange = event => {
		const text = event.target.value;

		const n = ColumnFooter.getValidNumberOrNull(text);
		if (n !== null) {
			this.commit(n);
		}

		this.setState({ text });
	};

	private onBlur = event =>
		this.commit(ColumnFooter.getValidNumberOrNull(this.state.text));

	static getValidNumberOrNull(input: string | null): number | null {
		if (input === null) {
			return null;
		}
		const n = input === "" ? 0 : parseFloat(input);
		if (isNaN(n) || !isFinite(n)) {
			return null;
		}
		return n;
	}

	private commit = (value: number | null) => {
		if (value !== null) {
			this.props.onWeightChanged(value);
		}
		this.setState({ text: null });
	};

	public render(): React.ReactNode {
		let element = null;
		if (this.props.editable) {
			element = (
				<input
					className="input-popularity"
					type="number"
					min={0}
					value={
						this.state.text !== null
							? this.state.text
							: "" + this.props.weight
					}
					onChange={this.onChange}
					onBlur={this.onBlur}
				/>
			);
		}

		const classNames = ["matchup-column-footer"];
		if (this.props.highlight) {
			classNames.push("highlight");
		}

		return (
			<div className={classNames.join(" ")} style={this.props.style}>
				<Bar
					total={this.props.max ? this.props.max : 100}
					value={this.props.weight}
					direction={BarDirection.VERTICAL}
					label={`${formatNumber(this.props.weight, 2)}%`}
					valueElement={element}
				/>
			</div>
		);
	}
}
