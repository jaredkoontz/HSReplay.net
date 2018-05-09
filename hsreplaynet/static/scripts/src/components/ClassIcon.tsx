import React from "react";
import Tooltip from "./Tooltip";
import { getCardClassName, getHeroClassName, image } from "../helpers";
import { CardClass } from "../hearthstone";
import { getCardClass } from "../utils/enums";

export interface ClassIconProps {
	cardClass: CardClass | string;
	small?: boolean;
	tooltip?: boolean;
}

export default class ClassIcon extends React.Component<ClassIconProps> {
	public render(): React.ReactNode {
		let fileName = "mode-icons/mode_ai.png";

		const cardClass = getCardClass(this.props.cardClass);
		const className = getCardClassName(cardClass);

		if (cardClass !== CardClass.INVALID) {
			fileName = `class-icons/${className.toLowerCase()}.png`;
		}

		let img = (
			<img src={image(fileName)} className="class-icon" alt={className} />
		);

		if (this.props.tooltip) {
			img = (
				<Tooltip
					content={getHeroClassName(className)}
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
