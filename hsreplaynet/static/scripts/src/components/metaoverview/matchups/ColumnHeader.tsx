import _ from "lodash";
import React from "react";
import { InjectedTranslateProps, Trans, translate } from "react-i18next";
import { image } from "../../../helpers";
import { ArchetypeData } from "../../../interfaces";
import Tooltip from "../../Tooltip";
import PrettyCardClass from "../../text/PrettyCardClass";

interface Props extends InjectedTranslateProps {
	archetypeId: number;
	archetypeName: string;
	archetypePlayerClass: string;
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
			this.props.archetypeId !== nextProps.archetypeId ||
			this.props.archetypeName !== nextProps.archetypeName ||
			this.props.archetypePlayerClass !==
				nextProps.archetypePlayerClass ||
			!_.isEqual(this.props.style, nextProps.style)
		);
	}

	public render(): React.ReactNode {
		const {
			archetypeId,
			archetypeName,
			archetypePlayerClass,
			isIgnored,
		} = this.props;
		const classNames = [
			"matchup-column-header matchup-column-header-archetype",
		];
		if (isIgnored) {
			classNames.push("ignored");
		}
		if (this.props.highlight) {
			classNames.push("highlight");
		}
		const playerClass = (
			<PrettyCardClass cardClass={archetypePlayerClass} />
		);
		const tooltip = isIgnored ? (
			<Trans defaults="Include <0></0>" components={[playerClass]} />
		) : (
			<Trans defaults="Ignore <0></0>" components={[playerClass]} />
		);

		return (
			<div
				className={classNames.join(" ")}
				onClick={() => {
					this.props.onIgnoredChanged(!this.props.isIgnored);
				}}
				style={this.props.style}
			>
				<span className="header-archetype-name">{archetypeName}</span>
				<Tooltip simple content={tooltip}>
					<img
						className="class-icon"
						src={image(
							`64x/class-icons/${archetypePlayerClass.toLowerCase()}.png`,
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
