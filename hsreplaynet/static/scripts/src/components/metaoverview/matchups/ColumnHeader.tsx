import _ from "lodash";
import React from "react";
import { Trans, WithTranslation, withTranslation } from "react-i18next";
import { getArchetypeUrl, image } from "../../../helpers";
import Tooltip from "../../Tooltip";
import PrettyCardClass from "../../text/PrettyCardClass";
import ArchetypeSignatureTooltip from "../ArchetypeSignatureTooltip";
import CardData from "../../../CardData";

interface Props extends WithTranslation {
	archetypeId: number;
	archetypeName: string;
	archetypePlayerClass: string;
	highlight?: boolean;
	isIgnored: boolean;
	onIgnoredChanged: (ignore: boolean, ignoreClass?: boolean) => void;
	style?: any;
	linkToArchetype: boolean;
	gameType: string;
	cardData: CardData;
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

		if (this.props.linkToArchetype) {
			return (
				<a
					href={getArchetypeUrl(archetypeId, archetypeName)}
					target="_blank"
					className={classNames.join(" ")}
					style={this.props.style}
				>
					<ArchetypeSignatureTooltip
						key={archetypeId}
						cardData={this.props.cardData}
						archetypeId={archetypeId}
						archetypeName={archetypeName}
						gameType={this.props.gameType}
					>
						<span className="header-archetype-name">
							{archetypeName}
						</span>
					</ArchetypeSignatureTooltip>
					<img
						className="class-icon"
						src={image(
							`64x/class-icons/${archetypePlayerClass.toLowerCase()}.png`,
						)}
					/>
				</a>
			);
		}

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

export default withTranslation()(ColumnHeader);
