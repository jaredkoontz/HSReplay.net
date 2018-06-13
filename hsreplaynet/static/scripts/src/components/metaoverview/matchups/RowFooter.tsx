import React from "react";
import _ from "lodash";
import { ArchetypeData } from "../../../interfaces";
import { getColorString } from "../../../helpers";
import { Colors } from "../../../Colors";
import { formatNumber } from "../../../i18n";

interface Props {
	archetypeData?: ArchetypeData;
	highlight?: boolean;
	style?: any;
}

export default class RowFooter extends React.Component<Props> {
	public shouldComponentUpdate(
		nextProps: Readonly<Props>,
		nextState: Readonly<{}>,
		nextContext: any,
	): boolean {
		return (
			this.props.highlight !== nextProps.highlight ||
			this.props.archetypeData.id !== nextProps.archetypeData.id ||
			this.props.archetypeData.effectiveWinrate !==
				nextProps.archetypeData.effectiveWinrate ||
			!_.isEqual(this.props.style, nextProps.style)
		);
	}

	public render(): React.ReactNode {
		const style = {
			backgroundColor: "transparent",
			...this.props.style,
		};

		const winrate = this.props.archetypeData.effectiveWinrate;
		const color = getColorString(
			Colors.REDORANGEGREEN,
			80,
			winrate / 100,
			false,
		);

		const label = isNaN(winrate) ? "-" : formatNumber(winrate, 2) + "%";

		style.backgroundColor = color;

		const classNames = ["row-footer"];
		if (this.props.highlight) {
			classNames.push("highlight");
		}

		return (
			<div className={classNames.join(" ")} style={style}>
				{label}
			</div>
		);
	}
}
