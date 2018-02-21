import React from "react";

interface Props {
	onReset: () => void;
	showReset: boolean;
}

export default class ResetHeader extends React.Component<Props> {
	public render(): React.ReactNode {
		const classNames = ["reset-header"];
		if (this.props.showReset) {
			classNames.push("btn btn-danger btn-full");
		}
		return (
			<h1
				className={classNames.join(" ")}
				onClick={() => this.props.onReset()}
				onKeyPress={event => {
					if (event.which !== 13) {
						return;
					}
					if (event.target) {
						(event.target as any).blur();
					}
					this.props.onReset();
				}}
				tabIndex={this.props.showReset ? 0 : -1}
			>
				{this.props.showReset
					? "Reset all filters"
					: this.props.children}
			</h1>
		);
	}
}
