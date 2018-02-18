import React from "react";
import clipboard from "clipboard-polyfill";
import { encode as encodeDeckstring } from "deckstrings";
import Tooltip from "./Tooltip";
import CardData from "../CardData";
import { toTitleCase } from "../helpers";
import { FormatType } from "../hearthstone";
import { CardData as HearthstoneJSONCardData } from "hearthstonejson-client";

interface CopyDeckButtonProps extends React.ClassAttributes<CopyDeckButton> {
	cardData: CardData;
	name?: string;
	deckClass?: string;
	cards: number[] | string[];
	heroes: number[];
	format: FormatType;
	sourceUrl?: string;
	simple?: boolean;
}

interface CopyDeckButtonState {
	copied?: boolean;
}

export default class CopyDeckButton extends React.Component<
	CopyDeckButtonProps,
	CopyDeckButtonState
> {
	private timeout: number;

	constructor(props: CopyDeckButtonProps, context: any) {
		super(props, context);
		this.state = {
			copied: false
		};
	}

	copy = (event: React.MouseEvent<HTMLSpanElement>) => {
		clipboard
			.writeText(this.buildCopieableString(event.shiftKey))
			.then(() => {
				this.setState({ copied: true });
				window.clearTimeout(this.timeout);
				this.timeout = window.setTimeout(() => {
					this.setState({ copied: false });
					this.timeout = null;
				}, 3000);
			});
	};

	render() {
		const classNames = ["copy-deck-button btn"];
		if (this.state.copied) {
			classNames.push("btn-success");
		} else {
			classNames.push("btn-primary");
		}
		if (this.props.simple) {
			classNames.push("glyphicon glyphicon-copy");
			return (
				<Tooltip
					content={this.state.copied ? "Copied!" : "Copy Deck Code"}
					simple={true}
				>
					<span
						className={classNames.join(" ")}
						onClick={this.copy}
					/>
				</Tooltip>
			);
		}

		return (
			<Tooltip
				header="After you click:"
				content={
					<p>
						Create a new deck in Hearthstone, or paste it into our
						own Hearthstone&nbsp;Deck&nbsp;Tracker.
					</p>
				}
				belowCursor
				centered
				yOffset={20}
			>
				<span className={classNames.join(" ")} onClick={this.copy}>
					{!this.state.copied ? (
						<span>
							<span className="glyphicon glyphicon-copy" />&nbsp;
						</span>
					) : null}
					{this.state.copied
						? "Deck copied!"
						: "Copy Deck to Hearthstone"}
				</span>
			</Tooltip>
		);
	}

	componentWillUnmount() {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
	}

	buildCopieableString(onlyDeckstring?: boolean): string {
		const dbfs = {};
		let cards = this.props.cards;
		if (cards.length > 0 && typeof cards[0] === "string") {
			cards = (cards as string[]).map(
				cardId => this.props.cardData.fromCardId(cardId).dbfId
			);
		}
		for (const card of cards) {
			if (typeof dbfs[card] === "undefined") {
				dbfs[card] = 1;
			} else {
				dbfs[card]++;
			}
		}
		const tuples = Object.keys(dbfs).map(dbfId => {
			return [+dbfId, +dbfs[dbfId]] as [number, number];
		});
		const format = this.props.format ? this.props.format : 1; // default to wild
		const deckstring = encodeDeckstring({
			cards: tuples,
			heroes: this.props.heroes,
			format
		});

		if (onlyDeckstring) {
			return deckstring;
		}

		const standard = format === 2;

		let prettyDeckList = null;
		if (this.props.cardData) {
			const dataCountTuples = tuples.map(([dbfId, count]) => {
				return [this.props.cardData.fromDbf(dbfId), count];
			}) as [HearthstoneJSONCardData, number][];
			dataCountTuples.sort(
				([a, x], [b, y]) => (a["name"] > b["name"] ? 1 : -1)
			);
			dataCountTuples.sort(
				([a, x], [b, y]) => (a["cost"] > b["cost"] ? 1 : -1)
			);
			prettyDeckList = dataCountTuples.map(
				([card, count]) => `${count}x (${card.cost}) ${card.name}`
			);
		}

		return [
			`### ${this.props.name || "HSReplay.net Deck"}`,
			...(this.props.deckClass
				? [`# Class: ${toTitleCase(this.props.deckClass)}`]
				: []),
			`# Format: ${standard ? "Standard" : "Wild"}`,
			...(standard ? ["# Year of the Mammoth"] : []),
			...(prettyDeckList
				? ["#", ...prettyDeckList.map(line => "# " + line)]
				: []),
			"#",
			deckstring,
			"#",
			"# To use this deck, copy it to your clipboard and create a new deck in Hearthstone",
			...(this.props.sourceUrl
				? [`# Find the deck on ${this.props.sourceUrl}`]
				: [])
		].join("\n");
	}
}
