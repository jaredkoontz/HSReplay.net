import React from "react";
import { getArchetypeUrl, winrateData } from "../../helpers";
import { LoadingStatus } from "../../interfaces";

interface Props {
	archetypeId?: number;
	archetypeName?: string;
	games?: number;
	playerClass?: string;
	title: string;
	winrate?: number;
	status?: LoadingStatus;
}

export default class MatchupBox extends React.Component<Props> {
	public render(): React.ReactNode {
		let content = null;
		if (
			this.props.playerClass &&
			this.props.games !== undefined &&
			this.props.winrate !== undefined
		) {
			const wrData = winrateData(50, this.props.winrate, 3);
			content = [
				<div>
					<span
						className={`player-class ${this.props.playerClass.toLowerCase()}`}
					>
						{this.props.archetypeName}
					</span>
				</div>,
				<div className="stats-table">
					<table>
						<tr>
							<th>Winrate:</th>
							<td style={{ color: wrData.color }}>
								{this.props.winrate}%
							</td>
						</tr>
						<tr>
							<th>Games:</th>
							<td>{this.props.games}</td>
						</tr>
					</table>
				</div>,
			];
		} else if (
			this.props.status === LoadingStatus.NO_DATA ||
			this.props.status === LoadingStatus.PROCESSING
		) {
			content = "Please check back later";
		}

		let href = null;
		if (this.props.archetypeId && this.props.archetypeName) {
			href = getArchetypeUrl(
				this.props.archetypeId,
				this.props.archetypeName,
			);
		}

		return (
			<div className="col-xs-12 col-sm-6 col-md-4 col-lg-4">
				<a className="box matchup-box" href={href}>
					<div className="box-title">{this.props.title}</div>
					<div className="box-content">{content}</div>
				</a>
			</div>
		);
	}
}
