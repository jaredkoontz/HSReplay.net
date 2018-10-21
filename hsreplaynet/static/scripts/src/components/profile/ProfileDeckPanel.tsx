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

	private renderArchetypeDeck(): React.ReactNode {
		const { data } = this.props;

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
					const components = signature && signature.components;
					if (!components) {
						return null;
					}

					const ccpSignature = data.archetype.standard_ccp_signature_core.components.slice(
						0,
						8,
					);

					const deck = decodeDeckstring(data.deckstring);
					const dbfIds = deck.cards
						.map(x => x[0])
						.filter(x => ccpSignature.indexOf(x) === -1);

					const weights = components
						.filter(x => dbfIds.indexOf(x[0]) !== -1)
						.slice();
					if (weights) {
						weights.sort((a, b) => a[1] - b[1]);
					}
					return weights
						.slice(0, 8)
						.map(([dbfId]) => (
							<CardIcon
								card={this.props.cardData.fromDbf(dbfId)}
							/>
						));
				}}
			</DataInjector>
		);
	}

	private renderDeck(): React.ReactNode {
		const { data } = this.props;
		const deck = decodeDeckstring(data.deckstring);
		const dbfIds = deck.cards.map(x => x[0]);
		return dbfIds
			.slice(0, 8)
			.map(dbfId => (
				<CardIcon card={this.props.cardData.fromDbf(dbfId)} />
			));
		return null;
	}
}
