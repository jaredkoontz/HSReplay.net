import React from "react";
import Tooltip, { ClickTouch, TooltipContent } from "./Tooltip";

export interface InfoIconProps {
	content?: TooltipContent | ClickTouch<TooltipContent>;
	header?: string;
	className?: string;
}

export default class InfoIcon extends React.Component<InfoIconProps> {
	public render(): React.ReactNode {
		return (
			<Tooltip
				className={
					"info-icon" +
					(this.props.className ? " " + this.props.className : "")
				}
				header={this.props.header}
				content={this.props.content}
			>
				&nbsp;
				<span
					className="glyphicon glyphicon-question-sign"
					aria-hidden="true"
				/>
			</Tooltip>
		);
	}
}
