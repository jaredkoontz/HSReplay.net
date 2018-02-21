import React from "react";
import { SortDirection } from "../interfaces";

interface Props {
	className?: string;
	direction?: SortDirection | null;
}

export default class SortIndicator extends React.Component<Props> {
	public render(): React.ReactNode {
		let classNameAsc = "glyphicon glyphicon-triangle-top";
		let classNameDesc = "glyphicon glyphicon-triangle-bottom";
		let className = this.props.className
			? this.props.className + " "
			: "" + "sort-indicator".trim();

		if (this.props.direction !== null) {
			className += " primary";
			if (this.props.direction === "ascending") {
				classNameAsc += " active";
			} else {
				classNameDesc += " active";
			}
		}

		return (
			<span className={className}>
				<span className={classNameAsc} />
				<span className={classNameDesc} />
			</span>
		);
	}
}
