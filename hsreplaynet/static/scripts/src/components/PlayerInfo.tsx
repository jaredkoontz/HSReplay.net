import React from "react";
import CardList from "./CardList";
import { GameReplay, GlobalGamePlayer } from "../interfaces";
import CardData from "../CardData";
import { getHeroClassName, getHeroDbfId, getHeroSkinCardUrl } from "../helpers";
import CopyDeckButton from "./CopyDeckButton";
import Tooltip from "./Tooltip";
import InfoIcon from "./InfoIcon";
import DataManager from "../DataManager";
import { WithTranslation, withTranslation } from "react-i18next";

interface Props extends WithTranslation {
	build: number;
	gameId: string;
	opponentName: string;
	playerName: string;
	cardData: CardData;
	playerExpandDirection: "up" | "down";
}

interface State {
	display: "player" | "opponent" | "both" | "none";
	game: GameReplay;
}

const DeckLink: React.FC<{ shortid: string | null }> = ({
	shortid,
	children,
}) => {
	if (!shortid) {
		return <span>{children}</span>;
	}
	return <a href={`/decks/${shortid}/`}>{children}</a>;
};

class PlayerInfo extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			display: props.playerExpandDirection === "up" ? "both" : "none",
			game: null,
		};
	}

	public componentDidMount(): void {
		if (this.props.gameId) {
			this.fetch();
		}
	}

	protected fetch() {
		DataManager.get("/api/v1/games/" + this.props.gameId + "/", {}).then(
			(json: any) => {
				this.setState({
					game: json,
				});
			},
		);
	}

	public render(): React.ReactNode {
		const { t } = this.props;

		let playerCards = null;
		let opponentCards = null;
		let playerShortid = null;
		let opponentShortid = null;
		let playerName = null;
		let opponentName = null;
		let playerCopyButton = null;
		let opponentCopyButton = null;
		let opponentInfoIcon = null;
		const opponentHeaderStyle = {};
		const playerHeaderStyle = {};
		const deckSourceUrl =
			window && window.location
				? window.location.toString().split("#")[0]
				: null;

		if (this.state.game) {
			const {
				friendly_deck,
				friendly_player,
				global_game,
				opposing_deck,
				opposing_player,
			} = this.state.game;
			playerName = friendly_player.name;
			opponentName = opposing_player.name;
			playerShortid = friendly_deck.shortid;
			opponentShortid = opposing_deck.shortid;

			if (
				opposing_deck &&
				Array.isArray(opposing_deck.cards) &&
				opposing_deck.cards.length > 0
			) {
				opponentCards = (
					<CardList
						cardData={this.props.cardData}
						cardList={opposing_deck.cards}
						predictedCardList={opposing_deck.predicted_cards}
					/>
				);
				if (opposing_deck.cards && opposing_deck.cards.length === 30) {
					opponentCopyButton = (
						<CopyDeckButton
							cardData={this.props.cardData}
							cards={opposing_deck.cards}
							deckClass={opposing_player.hero_class_name}
							heroes={[
								getHeroDbfId(
									this.props.cardData,
									opposing_player,
								),
							]}
							format={global_game.format}
							name={this.getDeckName(opposing_player)}
							simple
							sourceUrl={deckSourceUrl}
						/>
					);
				} else if (
					opposing_deck.predicted_cards &&
					opposing_deck.predicted_cards.length
				) {
					opponentCopyButton = (
						<CopyDeckButton
							cardData={this.props.cardData}
							cards={opposing_deck.predicted_cards}
							deckClass={opposing_player.hero_class_name}
							heroes={[
								getHeroDbfId(
									this.props.cardData,
									opposing_player,
								),
							]}
							format={global_game.format}
							name={this.getDeckName(opposing_player)}
							simple
							sourceUrl={deckSourceUrl}
						/>
					);
					opponentInfoIcon = (
						<InfoIcon
							header={t("Predicted deck")}
							content={t(
								"Based on cards seen, this is the most likely deck that was played.",
							)}
						/>
					);
				}
				opponentHeaderStyle[
					"backgroundImage"
				] = `url(${getHeroSkinCardUrl(
					opposing_player.hero_class_name,
				)})`;
			}
			if (
				friendly_deck &&
				Array.isArray(friendly_deck.cards) &&
				friendly_deck.cards.length > 0
			) {
				playerCards = (
					<CardList
						cardData={this.props.cardData}
						cardList={friendly_deck.cards}
					/>
				);
				if (friendly_deck.cards.length === 30) {
					playerCopyButton = (
						<CopyDeckButton
							simple
							cardData={this.props.cardData}
							cards={friendly_deck.cards}
							deckClass={friendly_player.hero_class_name}
							heroes={[
								getHeroDbfId(
									this.props.cardData,
									friendly_player,
								),
							]}
							format={global_game.format}
							name={this.getDeckName(friendly_player)}
							sourceUrl={deckSourceUrl}
						/>
					);
				}

				playerHeaderStyle[
					"backgroundImage"
				] = `url(${getHeroSkinCardUrl(
					friendly_player.hero_class_name,
				)})`;
			}
		}

		const { display } = this.state;
		const defaultDisplay =
			this.props.playerExpandDirection === "up" ? "both" : "none";

		const opponentDeck = [];
		const playerDeck = [];
		const separator =
			defaultDisplay === "none" ? null : (
				<div className="deck-separator" key="separator" />
			);
		if (display === "opponent" || display === "both") {
			opponentDeck.push(
				<div
					className={
						"deck-container" +
						(display === "opponent" ? " full" : "")
					}
					key="opponentCards"
				>
					{opponentCards}
				</div>,
			);
		}
		if (display === "both") {
			opponentDeck.push(
				<div className="gradient-container" key="opponentGradient" />,
			);
		}
		if (display === "player" || display === "both") {
			playerDeck.push(
				<div
					className={
						"deck-container" + (display === "player" ? " full" : "")
					}
					key="playerCards"
				>
					{playerCards}
				</div>,
			);
		}
		if (display === "both") {
			playerDeck.push(
				<div className="gradient-container" key="playerGradient" />,
			);
		}

		const opponentExpandButton = (
			<Tooltip
				simple
				content={display === "opponent" ? t("Collapse") : t("Expand")}
			>
				<span
					className={
						"btn btn-primary glyphicon glyphicon-menu-" +
						(display === "opponent" ? "up" : "down")
					}
					onClick={() =>
						this.setState({
							display:
								display === "opponent"
									? defaultDisplay
									: "opponent",
						})
					}
				/>
			</Tooltip>
		);

		const opponentHeader = (
			<div
				className="deck-header"
				style={opponentHeaderStyle}
				key="opponentHeader"
			>
				<div className="deck-header-fade" />
				<div className="deck-name">
					<DeckLink shortid={opponentShortid}>
						{`${this.pluralize(opponentName || "Opponent")} Deck`}
					</DeckLink>
					{opponentInfoIcon}
				</div>
				{opponentCopyButton}
				{this.state.game ? opponentExpandButton : null}
			</div>
		);

		const defaultDirection = this.props.playerExpandDirection;
		const toggledDirection =
			this.props.playerExpandDirection === "up" ? "down" : "up";

		const playerExpandButton = (
			<Tooltip
				simple
				content={display === "player" ? "Collapse" : "Expand"}
			>
				<span
					className={
						"btn btn-primary glyphicon glyphicon-menu-" +
						(display === "player"
							? toggledDirection
							: defaultDirection)
					}
					onClick={() =>
						this.setState({
							display:
								display === "player"
									? defaultDisplay
									: "player",
						})
					}
				/>
			</Tooltip>
		);

		const playerHeader = (
			<div
				className="deck-header"
				style={playerHeaderStyle}
				key="playerHeader"
			>
				<div className="deck-header-fade" />
				<div className="deck-name">
					<DeckLink shortid={playerShortid}>
						{`${this.pluralize(playerName || "Player")} Deck`}
					</DeckLink>
				</div>
				{playerCopyButton}
				{this.state.game ? playerExpandButton : null}
			</div>
		);

		const content = [opponentHeader, opponentDeck, separator];

		if (this.props.playerExpandDirection === "up") {
			content.push(playerDeck, playerHeader);
		} else {
			content.push(playerHeader, playerDeck);
		}

		return <div id="infobox-players">{content}</div>;
	}

	showCopyButton(player: GlobalGamePlayer): boolean {
		const playerHero = this.props.cardData.fromCardId(player.hero_id);
		return playerHero.type === "HERO" && playerHero.collectible;
	}

	buildPlayerClass(player: GlobalGamePlayer): string[] {
		const playerClass = ["infobox-value"];
		if (!player) {
			return playerClass;
		}
		if (player.is_ai) {
			playerClass.push("player-ai");
		}
		if (player.is_first) {
			playerClass.push("first-player");
		}
		return playerClass;
	}

	getDeckName(player: GlobalGamePlayer): string {
		const { t } = this.props;
		return (
			this.pluralize(player.name) +
			" " +
			getHeroClassName(player.hero_class_name, t)
		);
	}

	pluralize(str: string): string {
		return str + "'" + (str.charAt(str.length - 1) !== "s" ? "s" : "");
	}
}

export default withTranslation()(PlayerInfo);
