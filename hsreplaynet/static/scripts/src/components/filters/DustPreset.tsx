import * as React from "react";
import { GetDustValue } from "../../helpers";
import Tooltip from "../Tooltip";

interface Props {
	type: "common" | "rare" | "epic" | "legendary" | "owned";
	onClick: (value: number) => void;
	isActive: (value: number) => boolean;
	value?: number;
}

export default class  extends React.Component<Props> {
	render(): JSX.Element {
		const owned = this.props.type === "owned";
		const value = this.props.value || GetDustValue(this.props.type);
		const classNames = ["dust-preset"]
		if(this.props.isActive(value)) {
			classNames.push("active");
		}
		const basePath = STATIC_URL + "images/";
		const image = owned ? "dust.png" : `rarity-icons/rarity-${this.props.type}.png`;
		const tooltip = "+ " + (owned ? `All your Dust (${value})` : value + " Dust");
		return (
			<Tooltip
				content={tooltip}
				simple
				noSrTooltip
			>
				<img
					className={classNames.join(" ")}
					src={basePath + image}
					onClick={() => this.props.onClick(value)}
				/>
			</Tooltip>
		);
	}
}
