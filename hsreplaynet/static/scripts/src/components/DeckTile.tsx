import React from "react";
import * as _ from "lodash";
import CardIcon from "./CardIcon";
import ManaCurve from "./ManaCurve";
import { CardObj, DeckObj } from "../interfaces";
import {
	cardSorting,
	compareDecks,
	getFragments,
	getHeroClassName,
	getHeroSkinCardUrl,
	image,
	toPrettyNumber,
} from "../helpers";
import UserData from "../UserData";
import Tooltip from "./Tooltip";
import DataInjector from "./DataInjector";
import SemanticAge from "./SemanticAge";
import { TwitchStreamPromotionEvents } from "../metrics/GoogleAnalytics";
import { CardData as HearthstoneJSONCardData } from "hearthstonejson-client";
import { getDustCostForCollection } from "../utils/collection";
import { Collection, Stream } from "../utils/api";

interface ExternalProps extends DeckObj {
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
		if (UserData.hasFeature("deck-region-filter")) {
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
		const cards = this.props.cards || [];
		const cardIcons = [];

		if (this.props.compareWith) {
			const removed = this.props.compareWith.filter(c1 =>
				cards.every(c2 => c2.card.id !== c1.card.id),
			);
			removed.forEach(c => cards.push({ card: c.card, count: 0 }));
		}

		cards.sort(cardSorting);

		let canBeBuilt = !!this.props.collection;
		cards.forEach((obj, index: number) => {
			const card = obj.card;
			const count = +obj.count;
			const markStyle = {
				color: "#f4d442",
				fontSize: "1em",
				right: 0,
				top: 0,
			};

			let userOwns = null;
			if (
				this.props.collection &&
				typeof this.props.collection.collection === "object"
			) {
				const collectionCards = this.props.collection.collection;
				const dbfId = card.dbfId;
				const [nonGolden, golden] = collectionCards[dbfId] || [0, 0];
				userOwns = nonGolden + golden;
			}

			let remaining = count;
			let toCraft = null;

			if (
				!this.props.compareWith &&
				userOwns !== null &&
				userOwns < count
			) {
				const difference = count - userOwns;
				toCraft = (
					<li
						className={"missing-card"}
						key={`${count}x ${card.id} (to craft)`}
					>
						<CardIcon
							card={card}
							mark={this.getMark(card, difference)}
							markStyle={markStyle}
							tabIndex={-1}
							craftable
						/>
					</li>
				);
				canBeBuilt = false;
				remaining -= difference;
			}

			if (remaining > 0 || this.props.compareWith) {
				let itemClassName = null;
				let markText = this.getMark(card, remaining);

				if (this.props.compareWith) {
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
									(comparisonCard
										? comparisonCard.count
										: 0));
						} else if (comparisonCard.count > count) {
							itemClassName = "reduced";
							markText = "" + (count - comparisonCard.count);
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
								: `${count}x ${card.id}`
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
			}

			if (toCraft !== null) {
				cardIcons.push(toCraft);
			}
		});

		const dustCost = canBeBuilt
			? "Buildable"
			: getDustCostForCollection(this.props.collection, this.props.cards);

		const dustCostStyle = {
			backgroundImage: canBeBuilt
				? "url(/static/images/check.svg)"
				: "url(/static/images/dust.png)",
		};

		let deckName = this.props.archetypeName
			? this.props.archetypeName
			: getHeroClassName(this.props.playerClass);

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
					<div className="deck-tile">
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
								title={deckName}
							>
								{deckName}
							</span>
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

export default class InjectedDeckTile extends React.Component<ExternalProps> {
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
			>
				{({ streams }) => <DeckTile {...props} streams={streams} />}
			</DataInjector>
		);
	}
}
