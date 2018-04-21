import React from "react";
import { GetDustValue, image } from "../../helpers";
import Tooltip from "../Tooltip";

interface Props {
	type: "common" | "rare" | "epic" | "legendary" | "owned";
	onClick: (value: number) => void;
	isActive: (value: number) => boolean;
	value?: number;
}

export default class extends React.Component<Props> {
	render(): JSX.Element {
		const owned = this.props.type === "owned";
		const value = this.props.value || GetDustValue(this.props.type);
		const classNames = ["dust-preset"];
		if (this.props.isActive(value)) {
			classNames.push("active");
		}
		const filename = owned
			? "dust.png"
			: `rarity-icons/rarity-${this.props.type}.png`;
		const tooltip = `Spend ${
			owned ? `all your Dust (${value})` : value + " dust"
		}`;
		return (
			<Tooltip content={tooltip} simple noSrTooltip>
				<img
					className={classNames.join(" ")}
					src={image(filename)}
					onClick={() => this.props.onClick(value)}
				/>
			</Tooltip>
		);
	}
}
