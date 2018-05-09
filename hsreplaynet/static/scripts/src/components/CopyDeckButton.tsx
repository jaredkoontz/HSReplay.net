import clipboard from "clipboard-polyfill";
import { encode as encodeDeckstring } from "deckstrings";
import { CardData as HearthstoneJSONCardData } from "hearthstonejson-client";
import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import CardData from "../CardData";
import { FormatType } from "../hearthstone";
import { getHeroClassName } from "../helpers";
import Tooltip from "./Tooltip";

interface Props extends InjectedTranslateProps {
	cardData: CardData;
	onCopy?: () => any;
	name?: string;
	deckClass?: string;
	cards: number[] | string[];
	heroes: number[];
	format: FormatType;
	sourceUrl?: string;
	simple?: boolean;
}

interface State {
	copied: boolean;
}

class CopyDeckButton extends React.Component<Props, State> {
	private timeout: number;

	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			copied: false,
		};
	}

	copy = (event: React.MouseEvent<HTMLSpanElement>) => {
		clipboard
			.writeText(this.buildShareableString(event.shiftKey))
			.then(() => {
				this.setState({ copied: true });
				window.clearTimeout(this.timeout);
				this.timeout = window.setTimeout(() => {
					this.setState({ copied: false });
					this.timeout = null;
				}, 3000);
			});
		if (this.props.onCopy) {
			this.props.onCopy();
		}
	};

	public render(): React.ReactNode {
		const { t } = this.props;
		const classNames = ["copy-deck-button btn"];
		if (this.state.copied) {
			classNames.push("btn-success");
		} else {
			classNames.push("btn-primary");
		}
		const message = this.state.copied
			? t("Deck copied!")
			: t("Copy deck to Hearthstone");
		if (this.props.simple) {
			classNames.push("glyphicon glyphicon-copy");
			return (
				<Tooltip content={message} simple>
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
						{t(
							"Create a new deck in Hearthstone, or paste it into Hearthstone Deck Tracker.",
						)}
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
					{message}
				</span>
			</Tooltip>
		);
	}

	public componentWillUnmount(): void {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
	}

	buildShareableString(onlyDeckstring?: boolean): string {
		const { t } = this.props;
		const dbfs = {};
		let cards = this.props.cards;
		if (cards.length > 0 && typeof cards[0] === "string") {
			cards = (cards as string[]).map(
				cardId => this.props.cardData.fromCardId(cardId).dbfId,
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
			format,
		});

		if (onlyDeckstring) {
			return deckstring;
		}

		const standard = format === 2;

		let prettyDeckList: string[] = [];
		if (this.props.cardData) {
			const dataCountTuples = tuples.map(([dbfId, count]) => {
				return [this.props.cardData.fromDbf(dbfId), count];
			}) as [HearthstoneJSONCardData, number][];
			dataCountTuples.sort(
				([a, x], [b, y]) => (a["name"] > b["name"] ? 1 : -1),
			);
			dataCountTuples.sort(
				([a, x], [b, y]) => (a["cost"] > b["cost"] ? 1 : -1),
			);
			prettyDeckList = dataCountTuples.map(
				([card, count]) => `# ${count}x (${card.cost}) ${card.name}`,
			);
		}

		const deckName = this.props.name || t("HSReplay.net Deck");
		const className = getHeroClassName(this.props.deckClass || "NEUTRAL");
		const deckUrl = this.props.sourceUrl || "https://hsreplay.net/decks/";
		const formatName = format === 2 ? t("Standard") : t("Wild");

		return (
			[
				`### ${deckName}`,
				"# " + t("Class: {{ className }}", { className }),
				"# " + t("Format: {{ formatName }}", { formatName }),
				standard ? "# " + t("Year of the Raven") : "",
				"#",
				...prettyDeckList,
				"#",
				deckstring,
				"# " +
					t(
						"To use this deck, copy it to your clipboard and create a new deck in Hearthstone",
					),
				"# " + t("Find this deck on {{ deckUrl }}", { deckUrl }),
			]
				.filter(Boolean)
				.join("\n") + "\n"
		);
	}
}

export default translate()(CopyDeckButton);
