import React from "react";
import Tooltip from "./Tooltip";
import { toTitleCase } from "../helpers";

export interface ClassIconProps {
	heroClassName: string;
	small?: boolean;
	tooltip?: boolean;
}

export default class ClassIcon extends React.Component<ClassIconProps, any> {
	private readonly classes = [
		"druid",
		"hunter",
		"mage",
		"paladin",
		"priest",
		"rogue",
		"shaman",
		"warlock",
		"warrior"
	];

	public render(): React.ReactNode {
		const basePath =
			STATIC_URL + "images/" + (this.props.small ? "64x/" : "");
		const heroClassName = toTitleCase(this.props.heroClassName);
		const fileName = this.props.heroClassName.toLowerCase();
		let image = null;
		if (this.classes.indexOf(fileName) === -1) {
			image = (
				<img
					src={basePath + "mode-icons/mode_ai.png"}
					className="class-icon"
					alt={heroClassName}
				/>
			);
		} else {
			image = (
				<img
					src={basePath + "class-icons/" + fileName + ".png"}
					className="class-icon"
					alt={heroClassName}
				/>
			);
		}
		if (this.props.tooltip) {
			image = (
				<Tooltip
					content={toTitleCase(this.props.heroClassName)}
					simple
					noSrTooltip
				>
					{image}
				</Tooltip>
			);
		}
		return image;
	}
}
