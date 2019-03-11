import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import { getDustValue, image } from "../../helpers";
import Tooltip from "../Tooltip";

interface Props extends WithTranslation {
	type: "common" | "rare" | "epic" | "legendary" | "owned";
	onClick: (value: number) => void;
	isActive: (value: number) => boolean;
	value?: number;
}

class DustPreset extends React.Component<Props> {
	render(): React.ReactNode {
		const { t } = this.props;
		const owned = this.props.type === "owned";
		const value = this.props.value || getDustValue(this.props.type);
		const classNames = ["dust-preset"];
		if (this.props.isActive(value)) {
			classNames.push("active");
		}
		const filename = owned
			? "dust.png"
			: `rarity-icons/rarity-${this.props.type}.png`;

		const tooltip = owned
			? t("Spend all your dust ({value})", { value })
			: t("Spend {value} dust", { value });
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

export default withTranslation()(DustPreset);
