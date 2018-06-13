import React from "react";
import _ from "lodash";
import Bar, { BarDirection } from "./Bar";
import { ArchetypeData } from "../../../interfaces";
import { formatNumber } from "../../../i18n";

interface Props {
	archetypeData: ArchetypeData;
	highlight?: boolean;
	max?: number;
	style?: any;
	customWeight: number;
	useCustomWeight: boolean;
	onCustomWeightChanged: (popularity: number) => void;
}

interface State {
	text: string;
}

export default class ColumnFooter extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			text: "" + props.customWeight,
		};
	}

	public shouldComponentUpdate(
		nextProps: Readonly<Props>,
		nextState: Readonly<State>,
		nextContext: any,
	): boolean {
		return (
			this.props.highlight !== nextProps.highlight ||
			this.props.archetypeData.id !== nextProps.archetypeData.id ||
			this.props.archetypeData.popularityTotal !==
				nextProps.archetypeData.popularityTotal ||
			this.props.max !== nextProps.max ||
			this.props.customWeight !== nextProps.customWeight ||
			this.props.useCustomWeight !== nextProps.useCustomWeight ||
			!_.isEqual(this.props.style, nextProps.style) ||
			this.state.text !== nextState.text
		);
	}

	static getDerivedStateFromProps(
		nextProps: Readonly<Props>,
		prevState: State,
	): Partial<State> | null {
		if (nextProps.useCustomWeight) {
			return { text: "" + nextProps.customWeight };
		}
		return null;
	}

	public render(): React.ReactNode {
		let element = null;
		if (this.props.useCustomWeight) {
			element = (
				<input
					className="input-popularity"
					key={this.props.archetypeData.id}
					type="number"
					min={0}
					value={this.state.text}
					onChange={event => {
						this.setState({ text: event.target.value }, () =>
							this.attemptCommit(),
						);
					}}
				/>
			);
		}

		const classNames = ["matchup-column-footer"];
		if (this.props.highlight) {
			classNames.push("highlight");
		}

		const value = this.props.useCustomWeight
			? this.props.customWeight
			: this.props.archetypeData.popularityTotal;

		return (
			<div className={classNames.join(" ")} style={this.props.style}>
				<Bar
					total={this.props.max ? this.props.max : 100}
					value={value}
					direction={BarDirection.VERTICAL}
					label={`${formatNumber(
						this.props.archetypeData.popularityTotal,
						2,
					)}%`}
					valueElement={element}
				/>
			</div>
		);
	}

	private attemptCommit(): void {
		const value = this.state.text;
		const n = value === "" ? 0 : parseFloat(value);
		if (isNaN(n) || !isFinite(n)) {
			return;
		}
		this.props.onCustomWeightChanged(n);
	}
}
