import React from "react";
import Tooltip from "./Tooltip";
import { getHeroClassName, image } from "../helpers";

export interface ClassIconProps {
	heroClassName: string;
	small?: boolean;
	tooltip?: boolean;
}

export default class ClassIcon extends React.Component<ClassIconProps, any> {
	private readonly classes = [
		"DRUID",
		"HUNTER",
		"MAGE",
		"PALADIN",
		"PRIEST",
		"ROGUE",
		"SHAMAN",
		"WARLOCK",
		"WARRIOR",
	];

	public render(): React.ReactNode {
		const heroClassName = getHeroClassName(this.props.heroClassName);
		let fileName;

		if (this.classes.indexOf(this.props.heroClassName) === -1) {
			fileName = "mode-icons/mode_ai.png";
		} else {
			fileName = `class-icons/${this.props.heroClassName.toLowerCase()}.png`;
		}

		let img = (
			<img
				src={image(fileName)}
				className="class-icon"
				alt={heroClassName}
			/>
		);

		if (this.props.tooltip) {
			img = (
				<Tooltip
					content={getHeroClassName(this.props.heroClassName)}
					simple
					noSrTooltip
				>
					{img}
				</Tooltip>
			);
		}
		return img;
	}
}
