import React from "react";
import DustPreset from "./DustPreset";

interface Props {
	dust: number | null;
	setDust: (dust?: number) => any;
	ownedDust: number;
	maxDust?: number;
	id?: string;
}

interface State {
	input: string;
}

export default class DustFilter extends React.Component<Props, State> {
	static defaultProps = {
		maxDust: 50000,
	};

	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			input: this.props.dust !== null ? "" + this.props.dust : "0",
		};
	}

	public static getDerivedStateFromProps(
		nextProps: Readonly<Props>,
		prevState: State,
	): Partial<State> | null {
		if (nextProps.dust !== null) {
			return {
				input: "" + nextProps.dust,
			};
		}
		return null;
	}

	public render(): React.ReactNode {
		const onClick = (value: number) => {
			this.props.setDust(this.props.dust === value ? 0 : value);
		};
		const isActive = (value: number) => {
			return this.props.dust === value;
		};

		return (
			<div className="dust-filter">
				<DustPreset
					type="common"
					onClick={onClick}
					isActive={isActive}
				/>
				<DustPreset type="rare" onClick={onClick} isActive={isActive} />
				<DustPreset type="epic" onClick={onClick} isActive={isActive} />
				<DustPreset
					type="legendary"
					onClick={onClick}
					isActive={isActive}
				/>
				<DustPreset
					type="owned"
					onClick={onClick}
					isActive={isActive}
					value={this.ownedDust}
				/>
				<input
					id={this.props.id || undefined}
					type="number"
					step={100}
					value={this.state.input}
					min={0}
					max={this.maxDust}
					onChange={this.onChange}
					onKeyDown={this.onKeyDown}
					onBlur={this.commit}
					className="form-control"
				/>
			</div>
		);
	}

	private onChange = (e): void => {
		let input = e.target.value;
		const num = +input;
		if (!isNaN(num) && num > this.maxDust) {
			input = "" + this.maxDust;
		}
		this.setState({ input }, () => {
			if (this.state.input === "" + num) {
				this.commit();
			}
		});
	};

	private onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
		if (e.key === "Enter") {
			this.commit();
		}
	};

	private commit = (): void => {
		const num = Math.floor(+this.state.input);
		this.props.setDust(Math.max(0, Math.min(this.maxDust, num)));
	};

	private get ownedDust(): number {
		return Math.max(0, this.props.ownedDust);
	}

	private get maxDust(): number {
		return Math.max(this.ownedDust, this.props.maxDust);
	}
}
