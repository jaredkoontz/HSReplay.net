import React from "react";
import { ProfileArchetypeData } from "./ProfileArchetypeList";
import CardData from "../../CardData";
import ProfileDeckList from "./ProfileDeckList";
import { formatNumber } from "../../i18n";
import SemanticAge from "../text/SemanticAge";
import CardIcon from "../CardIcon";
import {
	getHeroClassName,
	getHeroSkinCardUrl,
	winrateData,
} from "../../helpers";
import ExpandTableButton from "./ExpandTableButton";
import { WithTranslation, withTranslation } from "react-i18next";
import ArchetypeSignatureTooltip from "../metaoverview/ArchetypeSignatureTooltip";

interface Props extends WithTranslation {
	data: ProfileArchetypeData;
	cardData: CardData;
	gameType: string;
}

interface State {
	expanded: boolean;
}

class ProfileArchetypePanel extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			expanded: false,
		};
	}

	public render(): React.ReactNode {
		const { t } = this.props;
		const className = ["profile-archetype-panel"];
		if (this.state.expanded) {
			className.push("expanded");
		}
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
			<li
				className={className.join(" ")}
				style={{
					backgroundImage: `url(${getHeroSkinCardUrl(
						data.playerClass,
					)})`,
				}}
			>
				<div className="background-fade horizontal" />
				<div className="background-fade vertical" />
				<div className="data-container">
					<div className="col-lg-3 col-md-3 col-sm-6 col-xs-6 align-left">
						<ExpandTableButton
							expandText="Decks"
							collapseText="Decks"
							expanded={this.state.expanded}
							onExpandedChanged={expanded =>
								this.setState({ expanded })
							}
							className="hidden-sm hidden-xs"
						/>
						<p
							className={`player-class ${data.playerClass.toLowerCase()}`}
						>
							{data.archetype ? (
								<ArchetypeSignatureTooltip
									key={data.archetype.id}
									cardData={this.props.cardData}
									archetypeId={data.archetype.id}
									archetypeName={data.archetype.name}
									gameType={this.props.gameType}
								>
									<a
										href={`/archetypes/${
											data.archetype.id
										}`}
									>
										{data.archetype.name}
									</a>
								</ArchetypeSignatureTooltip>
							) : (
								t("Other {cardClass}", {
									cardClass: getHeroClassName(
										data.playerClass,
										t,
									),
								})
							)}
						</p>
					</div>
					<div className="hidden-lg hidden-md col-sm-6 col-xs-6">
						{this.renderCardList(4)}
					</div>
					<div className="hidden-lg hidden-md col-sm-12 col-xs-12 labels">
						<div className="col-sm-4 col-xs-4">{t("Winrate")}</div>
						<div className="col-sm-4 col-xs-4">{t("Games")}</div>
						<div className="col-sm-4 col-xs-4">
							{t("Last Played")}
						</div>
					</div>
					<div className="col-lg-1 col-md-1 col-sm-4 col-xs-4">
						<div>
							<p style={winrateStyle}>
								{tendency}
								{formatNumber(
									100 * data.numWins / data.numGames,
									1,
								)}%
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
					<div className="col-lg-5 col-md-6 hidden-sm hidden-xs align-left">
						{this.renderCardList(8)}
					</div>
					<div className="hidden-lg hidden-md col-sm-12 col-xs-12 expand-table-button-wrapper">
						<ExpandTableButton
							expandText="Decks"
							collapseText="Decks"
							expanded={this.state.expanded}
							onExpandedChanged={expanded =>
								this.setState({ expanded })
							}
						/>
					</div>
				</div>
				<div className="clearfix" />
				{this.state.expanded ? (
					<ProfileDeckList
						data={data.decks}
						cardData={this.props.cardData}
						gameType={this.props.gameType}
					/>
				) : null}
				<div className="clearfix" />
			</li>
		);
	}

	private renderCardList(numCards: number): React.ReactNode {
		const { data } = this.props;
		return (
			<div className="card-list">
				{data.archetype &&
					data.archetype.standard_ccp_signature_core.components
						.slice(0, numCards)
						.map(dbfId => (
							<CardIcon
								card={this.props.cardData.fromDbf(dbfId)}
							/>
						))}
			</div>
		);
	}
}

export default withTranslation()(ProfileArchetypePanel);
