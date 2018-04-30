import React from "react";
import _ from "lodash";
import Bar, { BarDirection } from "./Bar";
import { ArchetypeData } from "../../../interfaces";

interface Props {
	archetypeData: ArchetypeData;
	highlight?: boolean;
	max?: number;
	style?: any;
	customWeight: number;
	useCustomWeight: boolean;
	onCustomWeightChanged: (popularity: number) => void;
	onHover?: (hovering: boolean) => void;
	onInputFocus?: (focus: boolean) => void;
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

	public componentWillReceiveProps(
		nextProps: Readonly<Props>,
		nextContext: any,
	): void {
		if (nextProps.useCustomWeight) {
			this.setState({ text: "" + nextProps.customWeight });
		}
	}

	public render(): React.ReactNode {
		let element = null;
		if (this.props.useCustomWeight) {
			element = (
				<input
					className="input-popularity"
					key={this.props.archetypeData.id}
					type="text"
					value={this.state.text}
					onChange={event =>
						this.setState({ text: event.target.value })
					}
					onFocus={(event: any) => {
						event.target.select();
						this.props.onInputFocus(true);
					}}
					onBlur={event => {
						this.onCustomPopularityChanged(event);
						this.props.onInputFocus(false);
					}}
					onKeyPress={event => {
						if (event.which === 13) {
							this.onCustomPopularityChanged(event);
						}
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
			<div
				className={classNames.join(" ")}
				style={this.props.style}
				onMouseEnter={() => this.props.onHover(true)}
				onMouseLeave={() => this.props.onHover(false)}
			>
				<Bar
					total={this.props.max ? this.props.max : 100}
					value={value}
					direction={BarDirection.VERTICAL}
					label={`${this.props.archetypeData.popularityTotal}%`}
					valueElement={element}
				/>
			</div>
		);
	}

	onCustomPopularityChanged(event: any) {
		const value = event.target.value;
		const n = value === "" ? 0 : parseFloat(value);
		if (!isNaN(n) && isFinite(n)) {
			this.props.onCustomWeightChanged(n);
		}
	}
}
