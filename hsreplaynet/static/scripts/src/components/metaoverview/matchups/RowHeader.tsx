import React from "react";
import _ from "lodash";
import { getArchetypeUrl, image } from "../../../helpers";
import CardData from "../../../CardData";
import ArchetypeSignatureTooltip from "../ArchetypeSignatureTooltip";
import OtherArchetype from "../OtherArchetype";

interface Props {
	archetypeId: number;
	archetypeName: string;
	archetypePlayerClass: string;
	cardData: CardData;
	gameType: string;
	highlight?: boolean;
	isFavorite?: boolean;
	onFavoriteChanged: (favorite: boolean) => void;
	style?: any;
}

export default class RowHeader extends React.Component<Props> {
	public shouldComponentUpdate(
		nextProps: Readonly<Props>,
		nextState: Readonly<{}>,
		nextContext: any,
	): boolean {
		return (
			this.props.highlight !== nextProps.highlight ||
			this.props.isFavorite !== nextProps.isFavorite ||
			this.props.archetypeId !== nextProps.archetypeId ||
			this.props.archetypeName !== nextProps.archetypeName ||
			this.props.archetypePlayerClass !==
				nextProps.archetypePlayerClass ||
			!_.isEqual(this.props.style, nextProps.style)
		);
	}

	public render(): React.ReactNode {
		let activeFavIcon = null;
		const favIconClasses = ["glyphicon glyphicon-star favorite-toggle"];
		if (this.props.isFavorite) {
			favIconClasses.push("favorite");
			activeFavIcon = (
				<span className="glyphicon glyphicon-star active-favorite" />
			);
		}
		const classNames = ["matchup-row-header"];
		if (this.props.highlight) {
			classNames.push("highlight");
		}

		return (
			<div className={classNames.join(" ")} style={this.props.style}>
				<div className="archetype matchup-archetype">
					<div
						className="class-icon-wrapper"
						onClick={e => {
							e.preventDefault();
							this.props.onFavoriteChanged(
								!this.props.isFavorite,
							);
						}}
					>
						<img
							className="class-icon"
							src={image(
								`64x/class-icons/${this.props.archetypePlayerClass.toLowerCase()}.png`,
							)}
						/>
						<span className={favIconClasses.join(" ")} />
						{activeFavIcon}
					</div>
					{this.renderName()}
				</div>
			</div>
		);
	}

	renderName(): React.ReactNode {
		const { archetypeId, archetypeName, archetypePlayerClass } = this.props;
		if (archetypeId < 0) {
			return (
				<OtherArchetype
					name={archetypeName}
					playerClass={archetypePlayerClass}
				/>
			);
		}
		return (
			<a
				href={getArchetypeUrl(archetypeId, archetypeName)}
				target="_blank"
			>
				<ArchetypeSignatureTooltip
					key={archetypeId}
					cardData={this.props.cardData}
					archetypeId={archetypeId}
					archetypeName={archetypeName}
					gameType={this.props.gameType}
				>
					<span className="archetype-name">{archetypeName}</span>
				</ArchetypeSignatureTooltip>
			</a>
		);
	}
}
