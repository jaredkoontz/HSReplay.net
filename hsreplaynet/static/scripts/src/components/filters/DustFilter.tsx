import React from "react";
import DustPreset from "./DustPreset";

interface Props {
	dust: number | null;
	setDust: (dust?: number) => any;
	ownedDust: number;
	maxDust?: number;
	id?: string;
}

export default class DustFilter extends React.Component<Props> {
	static defaultProps = {
		maxDust: 50000,
	};

	public render(): React.ReactNode {
		const onClick = (value: number) => {
			this.props.setDust(this.props.dust === value ? 0 : value);
		};
		const isActive = (value: number) => {
			return this.props.dust === value;
		};
		const ownedDust = Math.max(0, this.props.ownedDust);
		const maxDust = Math.max(ownedDust, this.props.maxDust);

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
					value={ownedDust}
				/>
				<input
					id={this.props.id || undefined}
					type="number"
					step={100}
					value={this.props.dust}
					min={0}
					max={maxDust}
					onChange={e => {
						this.props.setDust(
							Math.max(0, Math.min(maxDust, +e.target.value)),
						);
					}}
					className="form-control"
				/>
			</div>
		);
	}
}
