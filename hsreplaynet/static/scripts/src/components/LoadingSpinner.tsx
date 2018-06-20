import React from "react";

interface Props {
	active?: boolean;
	small?: boolean;
}

export default class LoadingSpinner extends React.Component<Props> {
	public render(): React.ReactNode {
		if (!this.props.active) {
			return null;
		}
		const className = ["loading-spinner"];
		if (this.props.small) {
			className.push("small");
		}
		return (
			<div className={className.join(" ")}>
				{Array.apply(null, { length: 12 }).map(x => <div />)}
			</div>
		);
	}
}
