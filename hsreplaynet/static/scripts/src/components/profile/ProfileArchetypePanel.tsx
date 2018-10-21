import React from "react";
import { ProfileArchetypeData } from "./ProfileArchetypeList";
import CardData from "../../CardData";
import ProfileDeckList from "./ProfileDeckList";
import { formatNumber } from "../../i18n";
import SemanticAge from "../text/SemanticAge";
import CardIcon from "../CardIcon";
import { getHeroClassName, winrateData } from "../../helpers";
import ExpandTableButton from "./ExpandTableButton";
import { translate } from "../../__mocks__/react-i18next";
import { InjectedTranslateProps } from "react-i18next";
import ArchetypeSignatureTooltip from "../metaoverview/ArchetypeSignatureTooltip";

interface Props extends InjectedTranslateProps {
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
			<li className={className.join(" ")}>
				<div className="data-container">
					<div className="col-lg-3 col-md-3 col-sm-2 col-xs-2 align-left">
						<ExpandTableButton
							expandText="Decks"
							collapseText="Decks"
							expanded={this.state.expanded}
							onExpandedChanged={expanded =>
								this.setState({ expanded })
							}
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
					<div className="col-lg-1 col-md-1 col-sm-2 col-xs-2">
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
									Avg. {formatNumber(data.globalWinrate, 1)}%
								</p>
							) : null}
						</div>
					</div>
					<div className="col-lg-1 col-md-1 col-sm-2 col-xs-2">
						{data.numGames}
					</div>
					<div className="col-lg-2 col-md-1 col-sm-2 col-xs-hidden">
						<SemanticAge date={data.lastPlayed} />
					</div>
					<div className="col-lg-5 col-md-6 col-sm-12 col-xs-12 align-left">
						<div className="card-list">
							{data.archetype &&
								data.archetype.standard_ccp_signature_core.components
									.slice(0, 8)
									.map(dbfId => (
										<CardIcon
											card={this.props.cardData.fromDbf(
												dbfId,
											)}
										/>
									))}
						</div>
					</div>
				</div>
				{this.state.expanded ? (
					<ProfileDeckList
						data={data.decks}
						cardData={this.props.cardData}
					/>
				) : null}
				<div className="clearfix" />
			</li>
		);
	}
}

export default translate()(ProfileArchetypePanel);
