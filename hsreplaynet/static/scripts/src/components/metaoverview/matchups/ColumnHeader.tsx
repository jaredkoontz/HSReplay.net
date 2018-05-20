import _ from "lodash";
import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import { getHeroClassName, image } from "../../../helpers";
import { ArchetypeData } from "../../../interfaces";
import Tooltip from "../../Tooltip";

interface Props extends InjectedTranslateProps {
	archetypeData: ArchetypeData;
	highlight?: boolean;
	isIgnored: boolean;
	onIgnoredChanged: (ignore: boolean, ignoreClass?: boolean) => void;
	style?: any;
}

class ColumnHeader extends React.Component<Props> {
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
		const { archetypeData, isIgnored, t } = this.props;
		const classNames = [
			"matchup-column-header matchup-column-header-archetype",
		];
		if (isIgnored) {
			classNames.push("ignored");
		}
		if (this.props.highlight) {
			classNames.push("highlight");
		}
		const heroClassName = getHeroClassName(archetypeData.playerClass);
		const tooltip = isIgnored
			? t("Include {name}", { name: heroClassName })
			: t("Ignore {name}", { name: heroClassName });

		return (
			<div
				className={classNames.join(" ")}
				onClick={() => {
					this.props.onIgnoredChanged(!this.props.isIgnored);
				}}
				style={this.props.style}
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

export default translate()(ColumnHeader);
