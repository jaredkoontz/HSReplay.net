import React from "react";

interface Props {
	active?: boolean;
	glyphicon?: string;
}

export default class LoadingSpinner extends React.Component<Props> {
	public render(): React.ReactNode {
		if (!this.props.active) {
			return null;
		}
		const glyphiconClassName =
			"glyphicon " + (this.props.glyphicon || "glyphicon-refresh");
		return (
			<div className="loading-spinner">
				<span className={glyphiconClassName} />
			</div>
		);
	}
}
