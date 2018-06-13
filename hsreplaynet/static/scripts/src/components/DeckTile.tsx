import { CardData as HearthstoneJSONCardData } from "hearthstonejson-client";
import _ from "lodash";
import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import UserData from "../UserData";
import {
	cardSorting,
	compareDecks,
	getFragments,
	getHeroClassName,
	getHeroSkinCardUrl,
	image,
	toPrettyNumber,
} from "../helpers";
import { CardObj, DeckObj } from "../interfaces";
import { TwitchStreamPromotionEvents } from "../metrics/GoogleAnalytics";
import { Collection, Stream } from "../utils/api";
import { getDustCostForCollection } from "../utils/collection";
import CardIcon from "./CardIcon";
import DataInjector from "./DataInjector";
import ManaCurve from "./ManaCurve";
import Tooltip from "./Tooltip";
import SemanticAge from "./text/SemanticAge";
import { formatNumber } from "../i18n";

interface ExternalProps extends DeckObj, InjectedTranslateProps {
	compareWith?: CardObj[];
	archetypeName?: string;
	hrefTab?: string;
	lastPlayed?: Date;
	collection: Collection | null;
}

interface Props extends ExternalProps {
	streams: Stream[];
}

class DeckTile extends React.Component<Props> {
	public getUrl(customTab?: string) {
		const { hrefTab } = this.props;
		const tab = customTab
			? { tab: customTab }
			: hrefTab && { tab: hrefTab };
		const fragments = ["gameType", "rankRange"];
		if (UserData.hasFeature("deck-detail-region-filter")) {
			fragments.push("region");
		}
		return `/decks/${this.props.deckId}/` + getFragments(fragments, tab);
	}

	protected getMark(card: HearthstoneJSONCardData, count: number): string {
		if (count > 1) {
			return `×${count}`;
		}

		if (card.rarity === "LEGENDARY") {
			return "★";
		}

		return "";
	}

	public render(): React.ReactNode {
		const { t } = this.props;
		const cards: CardObj[] = this.props.cards || [];
		const collection: Collection | null =
			this.props.collection && typeof this.props.collection === "object"
				? this.props.collection
				: null;

		if (this.props.compareWith) {
			const removedCards = this.props.compareWith.filter(c1 =>
				cards.every(c2 => c2.card.id !== c1.card.id),
			);
			removedCards.forEach(c => cards.push({ card: c.card, count: 0 }));
		}

		cards.sort(cardSorting);

		let canBeBuilt = !!collection;
		const cardIcons = cards.flatMap(cardObj => {
			const card = cardObj.card;
			const count = +cardObj.count;
			let userOwns = null;
			if (collection) {
				const [nonGolden, golden] = collection.collection[
					card.dbfId
				] || [0, 0];
				userOwns = nonGolden + golden;
				if (userOwns < count) {
					canBeBuilt = false;
				}
			}

			const markStyle = {
				color: "#f4d442",
				fontSize: "1em",
				right: 0,
				top: 0,
			};
			let markText = this.getMark(card, count);

			if (this.props.compareWith) {
				let itemClassName = null;
				const comparisonCard = this.props.compareWith.find(
					c => c.card.dbfId === card.dbfId,
				);
				if (count === 0) {
					itemClassName = "removed";
					markText = "" + -comparisonCard.count;
				} else {
					if (!comparisonCard || comparisonCard.count < count) {
						itemClassName = "added";
						markText =
							"+" +
							(count -
								(comparisonCard ? comparisonCard.count : 0));
					} else if (comparisonCard.count > count) {
						itemClassName = "reduced";
						markText = "" + (count - comparisonCard.count);
					} else {
						itemClassName = "unchanged";
					}
				}
				return [
					<li
						className={itemClassName}
						key={`${
							comparisonCard ? comparisonCard.count - count : 0
						}-${card.dbfId}-comparison`}
					>
						<CardIcon
							card={card}
							mark={markText}
							markStyle={markStyle}
							tabIndex={-1}
						/>
					</li>,
				];
			} else {
				if (userOwns > 0 && userOwns < count) {
					return [
						<li key={`${count}-${card.dbfId}-owned`}>
							<CardIcon
								card={card}
								mark={this.getMark(
									card,
									Math.min(userOwns, count),
								)}
								markStyle={markStyle}
								tabIndex={-1}
							/>
						</li>,
						<li key={`${count}-${card.dbfId}-craftable`}>
							<CardIcon
								card={card}
								mark={this.getMark(
									card,
									Math.max(count - userOwns, 0),
								)}
								markStyle={markStyle}
								craftable
								tabIndex={-1}
							/>
						</li>,
					];
				}
				return [
					<li key={`${count}-${card.dbfId}`}>
						<CardIcon
							card={card}
							mark={this.getMark(card, count)}
							markStyle={markStyle}
							craftable={collection && userOwns < count}
							tabIndex={-1}
						/>
					</li>,
				];
			}
		});

		const dustCost = canBeBuilt
			? t("Buildable")
			: getDustCostForCollection(this.props.collection, this.props.cards);

		const dustCostStyle = {
			backgroundImage: `url(${image(
				canBeBuilt ? "dust-check.png" : "dust.png",
			)})`,
		};

		const deckName = this.props.archetypeName
			? this.props.archetypeName
			: getHeroClassName(this.props.playerClass, t);

		let globalDataIndicator = null;
		if (this.props.hasGlobalData) {
			globalDataIndicator = (
				<Tooltip
					className="global-data-wrapper"
					header={t("Global statistics available")}
					content={t("This deck is eligible for global statistics.")}
				>
					<span className="glyphicon glyphicon-globe" />
				</Tooltip>
			);
		}

		const headerData = [];
		if (this.props.lastPlayed) {
			headerData.push(
				<span key="last-played" className="last-played">
					<SemanticAge date={this.props.lastPlayed} />
				</span>,
			);
		} else if (dustCost !== null) {
			headerData.push(
				<span
					key="dust-cost"
					className={
						"dust-cost" + (canBeBuilt ? " deck-buildable" : "")
					}
					style={dustCostStyle}
				>
					{dustCost}
				</span>,
			);
		}

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
					<img src={image("socialauth/twitch.png")} />
					&nbsp;{streamCount > 1
						? `${streamCount} streams`
						: "Live now"}
				</a>,
			);
		}

		return (
			<li
				style={{
					backgroundImage: `url(${getHeroSkinCardUrl(
						this.props.playerClass,
					)})`,
				}}
				key={this.props.deckId}
			>
				<a href={this.getUrl()}>
					<div
						className="deck-tile"
						data-card-class={this.props.playerClass}
					>
						<div className="col-lg-2 col-md-2 col-sm-2 col-xs-6">
							<span
								className="deck-name"
								style={{
									backgroundImage:
										"url(" +
										image(
											`64x/class-icons/${this.props.playerClass.toLowerCase()}.png`,
										) +
										")",
								}}
							>
								{deckName}
							</span>
							<small>{headerData}</small>
							{globalDataIndicator}
						</div>
						<div className="col-lg-1 col-md-1 col-sm-1 col-xs-3">
							<span className="win-rate">
								{formatNumber(+this.props.winrate, 1)}%
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
								title={t("Average game length")}
							>
								<span className="glyphicon glyphicon-time" />
								{/* FIXME i18n (use date-fns) */}
								{" " +
									`${(this.props.duration / 60).toFixed(
										1,
									)} min`}
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

class InjectedDeckTile extends React.Component<ExternalProps> {
	public render(): React.ReactNode {
		const props = _.omit(this.props, "children") as any;

		return (
			<DataInjector
				query={[
					{
						key: "streams",
						params: {},
						url: "/api/v1/live/streaming-now/",
					},
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
			>
				{({ streams }) => <DeckTile {...props} streams={streams} />}
			</DataInjector>
		);
	}
}

export default translate()(InjectedDeckTile);
