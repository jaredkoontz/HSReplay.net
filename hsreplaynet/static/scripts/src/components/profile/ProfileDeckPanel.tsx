import React from "react";
import { ProfileDeckData } from "./ProfileArchetypeList";
import { decode as decodeDeckstring } from "deckstrings";
import CardData from "../../CardData";
import ProfileReplayList from "./ProfileReplayList";
import { formatNumber } from "../../i18n";
import SemanticAge from "../text/SemanticAge";
import CardIcon from "../CardIcon";
import { winrateData } from "../../helpers";
import ExpandTableButton from "./ExpandTableButton";
import DataInjector from "../DataInjector";
import LoadingSpinner from "../LoadingSpinner";

interface Props {
	data: ProfileDeckData;
	cardData: CardData;
	cardUniqueness: number[];
}

interface State {
	expanded: boolean;
}

export default class ProfileDeckPanel extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			expanded: false,
		};
	}

	public render(): React.ReactNode {
		const { data } = this.props;
		const winrate = 100 * data.numWins / data.numGames;
		const hasGlobalWinrate = data.globalWinrate !== null;
		const wr = winrateData(
			hasGlobalWinrate ? data.globalWinrate : 50,
			winrate,
			2,
		);
		const tendency = hasGlobalWinrate ? wr.tendencyStr : null;
		const winrateStyle = { color: wr.color };

		return (
			<li className="profile-deck-panel">
				<div className="data-container">
					<div className="col-lg-2 col-lg-offset-1 align-left">
						<ExpandTableButton
							expandText="View Games"
							collapseText="Hide Games"
							expanded={this.state.expanded}
							onExpandedChanged={expanded =>
								this.setState({ expanded })
							}
						/>
						<div className="top-arrow-up" />
						{this.state.expanded ? (
							<div className="bottom-arrow-up" />
						) : null}
					</div>
					<div className="col-lg-1 winrate-cell">
						<div>
							<p style={winrateStyle}>
								{tendency}
								{formatNumber(winrate, 1)}%
							</p>
							{data.globalWinrate ? (
								<p className="global-winrate">
									Avg. {formatNumber(data.globalWinrate, 1)}%
								</p>
							) : null}
						</div>
					</div>
					<div className="col-lg-1">{data.numGames}</div>
					<div className="col-lg-2">
						<SemanticAge date={data.lastPlayed} />
					</div>
					<div className="col-lg-5 align-left">
						<div className="card-list">
							{data.archetype !== null
								? this.renderArchetypeDeck()
								: this.renderDeck()}
						</div>
					</div>
				</div>
				{this.state.expanded ? (
					<ProfileReplayList data={data.games} />
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

	private renderArchetypeDeck(): React.ReactNode {
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

					const deckCards = decodeDeckstring(data.deckstring).cards;
					const deckDbfIds = deckCards.map(x => x[0]);
					const uniqueCards = cardUniqueness
						.slice()
						.filter(x => deckDbfIds.indexOf(x) !== -1)
						.map(x => [x, deckCards.find(c => c[0] === x)[1]]);

					return uniqueCards
						.slice(0, 8)
						.map(([dbfId, count]) =>
							this.renderCardIcon(dbfId, count),
						);
				}}
			</DataInjector>
		);
	}

	private renderDeck(): React.ReactNode {
		const { data, cardUniqueness } = this.props;
		const deckCards = decodeDeckstring(data.deckstring).cards;
		const deckDbfIds = deckCards.map(x => x[0]);
		const uniqueCards = cardUniqueness
			.slice()
			.filter(x => deckDbfIds.indexOf(x) !== -1)
			.map(x => [x, deckCards.find(c => c[0] === x)[1]]);
		return uniqueCards
			.slice(0, 8)
			.map(([dbfId, count]) => this.renderCardIcon(dbfId, count));
	}
}
