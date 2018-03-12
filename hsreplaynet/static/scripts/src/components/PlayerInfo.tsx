import React from "react";
import CardList from "./CardList";
import { GameReplay, GlobalGamePlayer } from "../interfaces";
import CardData from "../CardData";
import { getHeroDbfId, getHeroSkinCardUrl } from "../helpers";
import CopyDeckButton from "./CopyDeckButton";
import Tooltip from "./Tooltip";
import InfoIcon from "./InfoIcon";
import DataManager from "../DataManager";
import UserData from "../UserData";

interface Props {
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

export default class PlayerInfo extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			display: props.playerExpandDirection === "up" ? "both" : "none",
			game: null,
		};
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
		let playerCards = null;
		let opponentCards = null;
		let playerName = null;
		let opponentName = null;
		let playerCopyButton = null;
		let opponentCopyButton = null;
		let opponentInfoIcon = null;
		const opponentHeaderStyle = {};
		const playerHeaderStyle = {};

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

			if (
				opposing_deck &&
				Array.isArray(opposing_deck.cards) &&
				opposing_deck.cards.length > 0
			) {
				const deckClass = this.toTitleCase(
					opposing_player.hero_class_name,
				);
				opponentCards = (
					<CardList
						cardData={this.props.cardData}
						cardList={opposing_deck.cards}
						predictedCardList={opposing_deck.predicted_cards}
					/>
				);
				if (
					UserData.hasFeature("replay-predicted-cards") &&
					opposing_deck.predicted_cards &&
					opposing_deck.predicted_cards.length
				) {
					opponentCopyButton = (
						<CopyDeckButton
							cardData={this.props.cardData}
							cards={opposing_deck.predicted_cards}
							deckClass={deckClass}
							heroes={[
								getHeroDbfId(
									this.props.cardData,
									opposing_player,
								),
							]}
							format={global_game.format}
							name={
								this.pluralize(opposing_player.name) +
								" " +
								deckClass
							}
							simple={true}
							sourceUrl={
								window && window.location
									? window.location.toString().split("#")[0]
									: undefined
							}
						/>
					);
					opponentInfoIcon = (
						<InfoIcon
							header="Opponent Deck"
							content="Based on cards seen, this is the most likely deck that was played."
						/>
					);
				}
				opponentHeaderStyle[
					"backgroundImage"
				] = `url(${getHeroSkinCardUrl(deckClass)})`;
			}
			if (
				friendly_deck &&
				Array.isArray(friendly_deck.cards) &&
				friendly_deck.cards.length > 0
			) {
				const deckClass = this.toTitleCase(
					friendly_player.hero_class_name,
				);
				playerCards = (
					<CardList
						cardData={this.props.cardData}
						cardList={friendly_deck.cards}
					/>
				);
				if (friendly_deck.cards.length === 30) {
					playerCopyButton = (
						<CopyDeckButton
							cardData={this.props.cardData}
							cards={friendly_deck.cards}
							deckClass={deckClass}
							heroes={[
								getHeroDbfId(
									this.props.cardData,
									friendly_player,
								),
							]}
							format={global_game.format}
							name={
								this.pluralize(friendly_player.name) +
								" " +
								deckClass
							}
							simple={true}
							sourceUrl={
								window && window.location
									? window.location.toString().split("#")[0]
									: undefined
							}
						/>
					);
				}

				playerHeaderStyle[
					"backgroundImage"
				] = `url(${getHeroSkinCardUrl(deckClass)})`;
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
				simple={true}
				content={display === "opponent" ? "Collapse" : "Expand"}
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
					<span>
						{(opponentName
							? this.pluralize(opponentName)
							: "Opponent") + " Deck"}
					</span>
					{opponentInfoIcon}
				</div>
				{opponentCopyButton}
				{this.state.game ? opponentExpandButton : null}
			</div>
		);

		const defaultDirection = this.props.playerExpandDirection;
		const toggledDriection =
			this.props.playerExpandDirection === "up" ? "down" : "up";

		const playerExpandButton = (
			<Tooltip
				simple={true}
				content={display === "player" ? "Collapse" : "Expand"}
			>
				<span
					className={
						"btn btn-primary glyphicon glyphicon-menu-" +
						(display === "player"
							? toggledDriection
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
					{(playerName ? this.pluralize(playerName) : "Player") +
						" Deck"}
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

	toTitleCase(str: string) {
		return (
			str.substr(0, 1).toUpperCase() +
			str.substr(1, str.length - 1).toLowerCase()
		);
	}

	pluralize(str: string): string {
		return str + "'" + (str.charAt(str.length - 1) !== "s" ? "s" : "");
	}
}
