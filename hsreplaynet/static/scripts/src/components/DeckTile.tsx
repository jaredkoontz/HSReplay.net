import React from "react";
import * as _ from "lodash";
import CardIcon from "./CardIcon";
import ManaCurve from "./ManaCurve";
import * as moment from "moment";
import { ApiStream, CardObj, DeckObj } from "../interfaces";
import {
	cardSorting,
	compareDecks,
	getFragments,
	getHeroCardId,
	toPrettyNumber,
	toTitleCase,
} from "../helpers";
import UserData from "../UserData";
import Tooltip from "./Tooltip";
import DataInjector from "./DataInjector";
import SemanticAge from "./SemanticAge";
import { TwitchStreamPromotionEvents } from "../metrics/GoogleAnalytics";

interface DeckTileProps extends DeckObj {
	dustCost?: number;
	compareWith?: CardObj[];
	archetypeName?: string;
	hrefTab?: string;
	lastPlayed?: Date;
}

interface StreamsProps {
	streams: ApiStream[];
}

interface Props extends DeckTileProps, StreamsProps {}

class DeckTile extends React.Component<Props> {
	public getUrl(customTab?: string) {
		const { hrefTab } = this.props;
		const tab = customTab
			? { tab: customTab }
			: hrefTab && { tab: hrefTab };
		const fragments = ["gameType", "rankRange"];
		if (UserData.hasFeature("deck-region-filter")) {
			fragments.push("region");
		}
		return `/decks/${this.props.deckId}/` + getFragments(fragments, tab);
	}

	public render(): React.ReactNode {
		const cards = this.props.cards || [];
		const cardIcons = [];

		if (this.props.compareWith) {
			const removed = this.props.compareWith.filter(c1 =>
				cards.every(c2 => c2.card.id !== c1.card.id),
			);
			removed.forEach(c => cards.push({ card: c.card, count: 0 }));
		}

		cards.sort(cardSorting);

		cards.forEach((obj, index: number) => {
			const card = obj.card;
			let markText = obj.count
				? card.rarity === "LEGENDARY"
					? "★"
					: obj.count > 1 && "x" + obj.count
				: null;
			const markStyle = {
				color: "#f4d442",
				fontSize: "1em",
				right: 0,
				top: 0,
			};

			let itemClassName = null;
			if (this.props.compareWith) {
				const comparisonCard = this.props.compareWith.find(
					c => c.card.id === card.id,
				);
				if (obj.count === 0) {
					itemClassName = "removed";
					markText = "" + -comparisonCard.count;
				} else {
					if (!comparisonCard || comparisonCard.count < obj.count) {
						itemClassName = "added";
						markText =
							"+" +
							(obj.count -
								(comparisonCard ? comparisonCard.count : 0));
					} else if (comparisonCard.count > obj.count) {
						itemClassName = "reduced";
						markText = "" + (obj.count - comparisonCard.count);
					} else {
						itemClassName = "unchanged";
					}
				}
			}

			cardIcons.push(
				<li
					className={itemClassName}
					key={
						this.props.compareWith
							? index
							: obj.count + "x " + card.id
					}
				>
					<CardIcon
						card={card}
						mark={markText}
						markStyle={markStyle}
						tabIndex={-1}
					/>
				</li>,
			);
		});

		const deckNameStyle = {
			backgroundImage:
				"url(/static/images/64x/class-icons/" +
				this.props.playerClass.toLowerCase() +
				".png)",
		};

		const dustCost =
			typeof this.props.dustCost === "number"
				? this.props.dustCost
				: null;

		const dustCostStyle = {
			backgroundImage: "url(/static/images/dust.png)",
		};

		let deckName = null;
		const playerClass = toTitleCase(this.props.playerClass);
		if (this.props.archetypeName) {
			deckName = (
				<span
					className="deck-name"
					style={deckNameStyle}
					title={playerClass}
				>
					{this.props.archetypeName}
				</span>
			);
		} else {
			deckName = (
				<span
					className="deck-name"
					style={deckNameStyle}
					title={playerClass}
				>
					{playerClass}
				</span>
			);
		}

		let globalDataIndicator = null;
		if (this.props.hasGlobalData) {
			globalDataIndicator = (
				<Tooltip
					className="global-data-wrapper"
					header="Global statistics available"
					content="This deck is eligible for global statistics."
				>
					<span className="glyphicon glyphicon-globe" />
				</Tooltip>
			);
		}

		let headerData = [];
		if (this.props.lastPlayed) {
			headerData = [
				<span key="last-played" className="last-played">
					<SemanticAge date={this.props.lastPlayed} />
				</span>,
			];
		} else if (dustCost !== null) {
			headerData = [
				<span
					key="dust-cost"
					className="dust-cost"
					style={dustCostStyle}
				>
					{this.props.dustCost}
				</span>,
			];
			if (this.props.streams && this.props.streams.length > 0) {
				const streamCount = this.props.streams.length;
				headerData.push(
					<a
						key="live-now"
						className="live-now text-twitch"
						href={this.getUrl("streams")}
						onClick={() =>
							TwitchStreamPromotionEvents.onClickLiveNow(
								this.props.deckId,
								{
									transport: "beacon",
								},
							)
						}
					>
						<img
							src={`${STATIC_URL}/images/socialauth/twitch.png`}
						/>
						&nbsp;{streamCount > 1
							? `${streamCount} streams`
							: "Live now"}
					</a>,
				);
			}
		}

		return (
			<li
				style={{
					backgroundImage:
						"url(https://art.hearthstonejson.com/v1/256x/" +
						getHeroCardId(this.props.playerClass, true) +
						".jpg)",
				}}
				key={this.props.deckId}
			>
				<a href={this.getUrl()}>
					<div className="deck-tile">
						<div className="col-lg-2 col-md-2 col-sm-2 col-xs-6">
							{deckName}
							<small>{headerData}</small>
							{globalDataIndicator}
						</div>
						<div className="col-lg-1 col-md-1 col-sm-1 col-xs-3">
							<span className="win-rate">
								{(+this.props.winrate).toFixed(1)}%
							</span>
						</div>
						<div className="col-lg-1 col-md-1 col-sm-1 col-xs-3">
							<span className="game-count">
								{toPrettyNumber(this.props.numGames)}
							</span>
						</div>
						<div className="col-lg-1 col-md-1 hidden-sm hidden-xs">
							<div
								className="duration"
								title="Average game length"
							>
								<span className="glyphicon glyphicon-time" />
								{" " +
									moment
										.duration(
											this.props.duration,
											"seconds",
										)
										.asMinutes()
										.toFixed(1) +
									" min"}
							</div>
						</div>
						<div className="col-lg-1 hidden-md hidden-sm hidden-xs">
							<ManaCurve cards={this.props.cards} />
						</div>
						<div className="col-lg-6 col-md-7 col-sm-8 hidden-xs">
							<ul className="card-list">{cardIcons}</ul>
						</div>
					</div>
				</a>
			</li>
		);
	}
}

export default class InjectedDeckTile extends React.Component<DeckTileProps> {
	public render(): React.ReactNode {
		const props = _.omit(this.props, "children") as any;

		return (
			<DataInjector
				query={[
					{ key: "streams", params: {}, url: "/live/streaming-now/" },
				]}
				extract={{
					streams: data => {
						const deck = [];
						this.props.cards.forEach(card => {
							for (let i = 0; i < card.count; i++) {
								deck.push(card.card.dbfId);
							}
						});
						return {
							streams: data.filter(
								stream =>
									Array.isArray(stream.deck) &&
									stream.deck.length &&
									compareDecks(stream.deck.map(Number), deck),
							),
						};
					},
				}}
				fetchCondition={UserData.hasFeature("twitch-stream-promotion")}
				key={props.deckId}
			>
				<DeckTile {...props} />
			</DataInjector>
		);
	}
}
