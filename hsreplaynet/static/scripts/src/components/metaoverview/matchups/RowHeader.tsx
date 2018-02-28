import React from "react";
import * as _ from "lodash";
import { ArchetypeData } from "../../../interfaces";
import { getArchetypeUrl } from "../../../helpers";
import CardData from "../../../CardData";
import ArchetypeSignatureTooltip from "../ArchetypeSignatureTooltip";
import OtherArchetype from "../OtherArchetype";

interface Props {
	archetypeData?: ArchetypeData;
	cardData: CardData;
	gameType: string;
	highlight?: boolean;
	isFavorite?: boolean;
	onFavoriteChanged: (favorite: boolean) => void;
	onHover?: (hovering: boolean) => void;
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
			this.props.archetypeData.id !== nextProps.archetypeData.id ||
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
			<div
				className={classNames.join(" ")}
				style={this.props.style}
				onMouseEnter={() => this.props.onHover(true)}
				onMouseLeave={() => this.props.onHover(false)}
			>
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
							src={`${STATIC_URL}images/64x/class-icons/${this.props.archetypeData.playerClass.toLowerCase()}.png`}
						/>
						<span className={favIconClasses.join(" ")} />
						{activeFavIcon}
					</div>
					{this.renderName()}
				</div>
			</div>
		);
	}

	renderName(): JSX.Element | string {
		const { archetypeData } = this.props;
		if (archetypeData.id < 0) {
			return (
				<OtherArchetype
					name={archetypeData.name}
					playerClass={archetypeData.playerClass}
				/>
			);
		}
		return (
			<a
				href={getArchetypeUrl(archetypeData.id, archetypeData.name)}
				target="_blank"
			>
				<ArchetypeSignatureTooltip
					key={archetypeData.id}
					cardData={this.props.cardData}
					archetypeId={archetypeData.id}
					archetypeName={archetypeData.name}
					gameType={this.props.gameType}
				>
					<span className="archetype-name">{archetypeData.name}</span>
				</ArchetypeSignatureTooltip>
			</a>
		);
	}
}
