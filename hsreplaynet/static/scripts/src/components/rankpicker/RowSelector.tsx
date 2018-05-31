import React from "react";

export type Mode = "add" | "set";

interface Props {
	classNames: string[];
	onClick: (mode: Mode) => void;
	mode: Mode;
	disabled?: boolean;
}

export default class RowSelector extends React.Component<Props> {
	private ref: HTMLButtonElement | null = null;

	public render(): React.ReactNode {
		const { mode, disabled } = this.props;
		const classNames = ["row-selector"].concat(this.props.classNames);
		const glyphicon = mode === "add" ? "plus" : "arrow-right";
		return (
			<button
				className={classNames.join(" ")}
				onClick={this.toggle}
				disabled={disabled}
				ref={ref => (this.ref = ref)}
			>
				<span className={`glyphicon glyphicon-${glyphicon}`} />
			</button>
		);
	}

	private toggle = (): void => {
		if (this.props.disabled) {
			return;
		}
		this.props.onClick(this.props.mode);
		if (this.ref) {
			this.ref.blur();
		}
	};
}
