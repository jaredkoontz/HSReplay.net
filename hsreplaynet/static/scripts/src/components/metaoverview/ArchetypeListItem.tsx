import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import CardData from "../../CardData";
import { getHeroSkinCardUrl, toDynamicFixed, winrateData } from "../../helpers";
import { ApiArchetypePopularity } from "../../interfaces";
import { Archetype } from "../../utils/api";
import CardIcon from "../CardIcon";

interface Props extends InjectedTranslateProps {
	archetype: ApiArchetypePopularity;
	archetypeData: Archetype[];
	cardData: CardData;
	data?: Archetype;
	deckData?: any;
}

class ArchetypeListItem extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t } = this.props;
		const archetype = this.props.archetypeData.find(
			a => a.id === this.props.archetype.archetype_id,
		);
		const imgUrl = `/static/images/64x/class-icons/${archetype.player_class_name.toLowerCase()}.png`;
		const coreCards = [];

		const { cardData } = this.props;
		const signature = archetype.standard_ccp_signature_core;
		if (signature) {
			signature.components.forEach(dbfId => {
				coreCards.push(
					<li key={dbfId}>
						<CardIcon card={cardData.fromDbf(dbfId)} />
					</li>,
				);
			});
		}

		const { color } = winrateData(50, this.props.archetype.win_rate, 3);
		const backgroundImage = `url(${getHeroSkinCardUrl(
			archetype.player_class_name,
		)})`;

		const deckData = this.props.deckData[archetype.player_class_name];
		if (!deckData) {
			return null;
		}
		const deck = deckData
			.filter(d => d.archetype_id === archetype.id)
			.sort((a, b) => b.total_games - a.total_games)[0];

		let deckButton = null;
		if (deck) {
			deckButton = (
				<a
					className="btn btn-primary btn-deck"
					href={`/decks/${deck.deck_id}`}
				>
					{t("View most popular deck")}
				</a>
			);
		}

		return (
			<li className="archetype-list-item" style={{ backgroundImage }}>
				<a href={archetype.url}>
					<div className="archetype-header col-sm-12 col-md-3">
						<img className="archetype-icon" src={imgUrl} />
						<div className="archetype-info">
							<div className="archetype-name">
								{archetype.name}
							</div>
							<div className="foo">
								<div
									className="archetype-data"
									style={{ color }}
								>
									{toDynamicFixed(
										this.props.archetype.win_rate,
										2,
									)}%
								</div>
							</div>
						</div>
					</div>
					<div className="archetype-cards col-xs-12 col-md-5">
						<span className="archetype-cards-header">
							{t("Core cards")}
						</span>
						<ul className="archetype-card-list">
							{coreCards.slice(0, 8)}
						</ul>
					</div>
					<div className="archetype-btn-container col-xs-12 col-md-4">
						{deckButton}
					</div>
					<div className="clearfix" />
				</a>
			</li>
		);
	}
}

export default translate()(ArchetypeListItem);
