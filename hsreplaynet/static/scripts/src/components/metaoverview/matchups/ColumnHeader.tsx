import React from "react";
import * as _ from "lodash";
import { ArchetypeData } from "../../../interfaces";
import Tooltip from "../../Tooltip";
import { getHeroClassName, image } from "../../../helpers";

interface Props {
	archetypeData: ArchetypeData;
	highlight?: boolean;
	isIgnored: boolean;
	onIgnoredChanged: (ignore: boolean, ignoreClass?: boolean) => void;
	style?: any;
	onHover?: (hovering: boolean) => void;
}

export default class ColumnHeader extends React.Component<Props> {
	public shouldComponentUpdate(
		nextProps: Readonly<Props>,
		nextState: Readonly<{}>,
		nextContext: any,
	): boolean {
		return (
			this.props.highlight !== nextProps.highlight ||
			this.props.isIgnored !== nextProps.isIgnored ||
			this.props.archetypeData.id !== nextProps.archetypeData.id ||
			!_.isEqual(this.props.style, nextProps.style)
		);
	}

	public render(): React.ReactNode {
		const { archetypeData, isIgnored } = this.props;
		const classNames = [
			"matchup-column-header matchup-column-header-archetype",
		];
		if (isIgnored) {
			classNames.push("ignored");
		}
		if (this.props.highlight) {
			classNames.push("highlight");
		}
		const tooltip =
			(isIgnored ? "Include " : "Ignore ") +
			getHeroClassName(archetypeData.playerClass);
		return (
			<div
				className={classNames.join(" ")}
				onClick={() => {
					this.props.onIgnoredChanged(!this.props.isIgnored);
				}}
				style={this.props.style}
				onMouseEnter={() => this.props.onHover(true)}
				onMouseLeave={() => this.props.onHover(false)}
			>
				<span className="header-archetype-name">
					{archetypeData.name}
				</span>
				<Tooltip simple header={tooltip}>
					<img
						className="class-icon"
						src={image(
							`64x/class-icons/${archetypeData.playerClass.toLowerCase()}.png`,
						)}
						onClick={e => {
							this.props.onIgnoredChanged(
								!this.props.isIgnored,
								true,
							);
							e.stopPropagation();
						}}
					/>
				</Tooltip>
			</div>
		);
	}
}
