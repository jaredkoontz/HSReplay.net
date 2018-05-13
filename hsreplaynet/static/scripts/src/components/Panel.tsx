import React from "react";

interface Props {
	header?: string | React.ReactNode;
	theme?: "light" | "dark";
	accent?: "blue" | "red" | "premium";
}

export default class Panel extends React.Component<Props> {
	public render(): React.ReactNode {
		const header = this.props.header ? (
			<div className="panel-header">{this.props.header}</div>
		) : null;
		const theme = this.props.theme || "light";
		const accent = this.props.accent || "blue";
		return (
			<div
				className={`panel-card panel-theme-${theme} panel-accent-${accent}`}
			>
				{header}
				<div
					className={`panel-content ${
						this.props.header ? "" : "no-header"
					}`}
				>
					{this.props.children}
				</div>
			</div>
		);
	}
}
