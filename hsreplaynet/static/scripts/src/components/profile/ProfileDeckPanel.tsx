import React from "react";
import { ProfileDeckData } from "./ProfileArchetypeList";
import { DeckList, decode as decodeDeckstring } from "deckstrings";
import CardData from "../../CardData";
import ProfileReplayList from "./ProfileReplayList";
import { formatNumber } from "../../i18n";
import SemanticAge from "../text/SemanticAge";
import CardIcon from "../CardIcon";
import { getHeroClassName, winrateData } from "../../helpers";
import ExpandTableButton from "./ExpandTableButton";
import DataInjector from "../DataInjector";
import LoadingSpinner from "../LoadingSpinner";
import DeckListTooltip from "../DeckListTooltip";
import { WithTranslation, withTranslation } from "react-i18next";

interface Props extends WithTranslation {
	data: ProfileDeckData;
	cardData: CardData;
	cardUniqueness: number[];
	gameType: string;
}

interface State {
	expanded: boolean;
}

class ProfileDeckPanel extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			expanded: false,
		};
	}

	public render(): React.ReactNode {
		const { data, t } = this.props;
		const winrate = 100 * data.numWins / data.numGames;
		const hasGlobalWinrate = data.globalWinrate !== null;
		const wr = winrateData(
			hasGlobalWinrate ? data.globalWinrate : 50,
			winrate,
			2,
		);
		const tendency = hasGlobalWinrate ? wr.tendencyStr : null;
		const winrateStyle = { color: wr.color };

		const deckCards = decodeDeckstring(data.deckstring).cards;
		const dbfIds = [];
		deckCards.forEach(([dbfId, count]) => {
			for (let i = 0; i < count; i++) {
				dbfIds.push(dbfId);
			}
		});

		return (
			<li className="profile-deck-panel">
				<div className="data-container">
					<div className="deck-spacer col-lg-1 col-md-1 hidden-sm hidden-xs" />
					<div className="col-lg-2 col-md-2 hidden-sm hidden-xs align-left">
						<ExpandTableButton
							expandText="Games"
							collapseText="Games"
							expanded={this.state.expanded}
							onExpandedChanged={expanded =>
								this.setState({ expanded })
							}
						/>
						<div className="top-arrow-up border" />
						<div className="top-arrow-up" />
						{this.state.expanded ? (
							<div className="bottom-arrow-up" />
						) : null}
					</div>
					<div className="hidden-lg hidden-md col-sm-12 col-xs-12">
						<div className="card-list">
							{data.archetype !== null
								? this.renderArchetypeDeck(deckCards, 8)
								: this.renderDeck(deckCards, 8)}
						</div>
					</div>
					<div className="col-lg-1 col-md-1 col-sm-4 col-xs-4 winrate-cell">
						<div>
							<p style={winrateStyle}>
								{tendency}
								{formatNumber(winrate, 1)}%
							</p>
							{data.globalWinrate ? (
								<p className="global-winrate">
									{t("Avg. {winrate}%", {
										winrate: formatNumber(
											data.globalWinrate,
											1,
										),
									})}
								</p>
							) : null}
						</div>
					</div>
					<div className="col-lg-1 col-md-1 col-sm-4 col-xs-4">
						{data.numGames}
					</div>
					<div className="col-lg-2 col-md-1 col-sm-4 col-xs-4">
						<SemanticAge date={data.lastPlayed} />
					</div>
					<div className="col-lg-5 col-md-6 hidden-sm hidden-xs card-list-cell">
						<div className="card-list hidden-lg">
							{data.archetype !== null
								? this.renderArchetypeDeck(deckCards, 6)
								: this.renderDeck(deckCards, 6)}
						</div>
						<div className="card-list hidden-md">
							{data.archetype !== null
								? this.renderArchetypeDeck(deckCards, 8)
								: this.renderDeck(deckCards, 8)}
						</div>
						<DeckListTooltip
							deckName={
								data.archetype
									? data.archetype.name
									: t("Other {cardClass}", {
											cardClass: getHeroClassName(
												data.playerClass,
												t,
											),
									  })
							}
							gameType={this.props.gameType}
							cards={dbfIds}
							cardData={this.props.cardData}
						>
							<a
								className="btn btn-view-deck"
								href={data.deckUrl}
							>
								{t("View Deck")}
							</a>
						</DeckListTooltip>
					</div>
					<div className="hidden-lg hidden-md col-sm-6 col-xs-6">
						<ExpandTableButton
							expandText="Games"
							collapseText="Games"
							expanded={this.state.expanded}
							onExpandedChanged={expanded =>
								this.setState({ expanded })
							}
						/>
					</div>
					<div className="hidden-lg hidden-md col-sm-6 col-xs-6">
						<a className="btn btn-view-deck" href={data.deckUrl}>
							{t("View Deck")}
						</a>
					</div>
				</div>
				<div className="clearfix" />
				{this.state.expanded ? (
					<ProfileReplayList
						data={data.games}
						cardData={this.props.cardData}
						gameType={this.props.gameType}
					/>
				) : null}
				<div className="clearfix" />
			</li>
		);
	}

	private renderCardIcon(dbfId: number, count: number): React.ReactNode {
		const card = this.props.cardData.fromDbf(dbfId);
		let mark = "";
		if (count > 1) {
			mark = `×${count}`;
		} else if (card.rarity === "LEGENDARY") {
			mark = "★";
		}
		return (
			<CardIcon
				card={card}
				markStyle={{
					color: "#f4d442",
					fontSize: "1em",
					right: 0,
					top: 0,
				}}
				mark={mark}
			/>
		);
	}

	private renderArchetypeDeck(
		cards: DeckList,
		numCards: number,
	): React.ReactNode {
		const { data, cardUniqueness } = this.props;

		return (
			<DataInjector
				query={{
					url: `/api/v1/archetypes/${data.archetype.id}`,
					key: "archetypeData",
				}}
			>
				{({ archetypeData }) => {
					if (!archetypeData) {
						return <LoadingSpinner active small />;
					}
					const signature =
						archetypeData && archetypeData.standard_signature;
					const components =
						signature && signature.components.slice();
					if (!components) {
						return null;
					}

					const deckDbfIds = cards.map(x => x[0]);
					const uniqueCards = cardUniqueness
						.slice()
						.filter(x => deckDbfIds.indexOf(x) !== -1)
						.map(x => [x, cards.find(c => c[0] === x)[1]]);

					return uniqueCards
						.slice(0, numCards)
						.map(([dbfId, count]) =>
							this.renderCardIcon(dbfId, count),
						);
				}}
			</DataInjector>
		);
	}

	private renderDeck(cards: DeckList, numCards: number): React.ReactNode {
		const { data, cardUniqueness } = this.props;
		const deckDbfIds = cards.map(x => x[0]);
		const uniqueCards = cardUniqueness
			.slice()
			.filter(x => deckDbfIds.indexOf(x) !== -1)
			.map(x => [x, cards.find(c => c[0] === x)[1]]);
		return uniqueCards
			.slice(0, numCards)
			.map(([dbfId, count]) => this.renderCardIcon(dbfId, count));
	}
}

export default withTranslation()(ProfileDeckPanel);
