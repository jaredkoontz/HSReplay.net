import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";

interface Props extends InjectedTranslateProps {
	expandText: string;
	collapseText: string;
	expanded: boolean;
	onExpandedChanged: (expanded) => void;
	className?: string;
}

class ExpandTableButton extends React.Component<Props> {
	public render(): React.ReactNode {
		const className = ["expand-table-button"];
		if (this.props.expanded) {
			className.push("expanded");
		}
		if (this.props.className) {
			className.push(this.props.className);
		}

		return (
			<a
				className={className.join(" ")}
				href="#"
				onClick={e => {
					e.preventDefault();
					this.props.onExpandedChanged(!this.props.expanded);
				}}
			>
				{this.props.expanded ? (
					<span className="glyphicon glyphicon-menu-up" />
				) : (
					<span className="glyphicon glyphicon-menu-down" />
				)}
				{this.props.expanded
					? this.props.collapseText
					: this.props.expandText}
			</a>
		);
	}
}

export default translate()(ExpandTableButton);
