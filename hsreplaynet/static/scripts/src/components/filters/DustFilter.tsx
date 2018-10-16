import React from "react";
import DustPreset from "./DustPreset";

interface Props {
	dust: number | null;
	setDust: (dust: number) => void;
	ownedDust: number;
	maxDust?: number;
	id?: string;
}

interface State {
	input: string | null;
}

export default class DustFilter extends React.Component<Props, State> {
	static defaultProps = {
		maxDust: 50000,
	};

	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			input: null,
		};
	}

	public render(): React.ReactNode {
		const onClick = (value: number) => {
			this.props.setDust(this.props.dust === value ? 0 : value);
		};
		const isActive = (value: number) => {
			return this.props.dust === value;
		};

		return (
			<form className="dust-filter" onSubmit={this.commit}>
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
					step={5}
					value={
						this.state.input !== null
							? this.state.input
							: "" + this.props.dust
					}
					min={0}
					max={this.maxDust}
					onChange={this.onChange}
					onBlur={this.commit}
					className="form-control"
				/>
			</form>
		);
	}

	private onChange = (e): void => {
		const input = e.target.value;
		const n = this.getValidInputOrNull(input);
		this.setState({ input });
	};

	private getValidInputOrNull = (input: string | null): number | null => {
		const n = +input;
		if (isNaN(n) || !isFinite(n)) {
			return null;
		}
		if (n > this.props.maxDust || n < 0) {
			return null;
		}
		return Math.floor(n);
	};

	private commit = (): void => {
		if (!this.state.input) {
			return;
		}
		const n = this.getValidInputOrNull(this.state.input);
		if (n !== null) {
			this.props.setDust(n);
		}
		this.setState({ input: null });
	};

	private get ownedDust(): number {
		return Math.max(0, this.props.ownedDust);
	}

	private get maxDust(): number {
		return Math.max(this.ownedDust, this.props.maxDust);
	}
}
