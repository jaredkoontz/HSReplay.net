import React from "react";
import _ from "lodash";
import { MatchupData } from "../../../interfaces";
import {
	commaSeparate,
	getColorString,
	toDynamicFixed,
} from "../../../helpers";
import { Colors } from "../../../Colors";
import Tooltip from "../../Tooltip";

interface Props {
	highlightColumn?: boolean;
	highlightRow?: boolean;
	matchupData: MatchupData;
	isIgnored: boolean;
	style?: any;
}

export default class MatchupCell extends React.Component<Props> {
	public static isEligibleMatchup(games: number): boolean {
		return games >= 30;
	}

	public shouldComponentUpdate(
		nextProps: Readonly<Props>,
		nextState: Readonly<{}>,
		nextContext: any,
	): boolean {
		return (
			this.props.highlightColumn !== nextProps.highlightColumn ||
			this.props.highlightRow !== nextProps.highlightRow ||
			this.props.isIgnored !== nextProps.isIgnored ||
			!_.isEqual(this.props.style, nextProps.style) ||
			!_.isEqual(this.props.matchupData, nextProps.matchupData)
		);
	}

	public render(): React.ReactNode {
		const { matchupData } = this.props;
		let label: string | JSX.Element = "";
		const color = "black";
		let backgroundColor = "white";
		const winrate = matchupData.winrate || 0;
		const classNames = ["matchup-cell"];

		if (matchupData.friendlyId === matchupData.opponentId) {
			// mirror match
			label = (
				<Tooltip content="Mirror&nbsp;matchup" simple>
					<svg
						viewBox={"0 0 10 10"}
						style={{ height: "1em", verticalAlign: "middle" }}
					>
						<path
							id="foo"
							d="M1 9 L 9 1"
							style={{
								stroke: "black",
								strokeWidth: "0.6pt",
								strokeOpacity: 1,
								strokeLinejoin: "round",
							}}
						/>
					</svg>
				</Tooltip>
			);
			backgroundColor = "rgb(200,200,200)";
		} else if (MatchupCell.isEligibleMatchup(matchupData.totalGames)) {
			// actual matchup
			backgroundColor = getColorString(
				Colors.REDORANGEGREEN,
				70,
				winrate / 100,
				false,
			);
			label = (
				<Tooltip
					simple
					id="tooltip-matchup-cell"
					content={
						<div>
							<span
								className={
									"tooltip-header player-class " +
									matchupData.friendlyPlayerClass.toLowerCase()
								}
							>
								{matchupData.friendlyName}
							</span>
							<table>
								<tr>
									<th>Versus:</th>
									<td>
										<span
											className={
												"player-class " +
												matchupData.opponentPlayerClass.toLowerCase()
											}
										>
											{matchupData.opponentName}
										</span>
									</td>
								</tr>
								<tr>
									<th>Winrate:</th>
									<td>{toDynamicFixed(winrate, 2)}%</td>
								</tr>
								<tr>
									<th>Games:</th>
									<td>
										{commaSeparate(
											matchupData.totalGames || 0,
										)}
									</td>
								</tr>
							</table>
						</div>
					}
				>
					{`${winrate.toFixed(2)}%`}
				</Tooltip>
			);
		} else {
			// not enough data
			label = (
				<Tooltip content="Not enough games" simple>
					⁓
				</Tooltip>
			);
			backgroundColor = "rgb(200,200,200)";
		}

		if (this.props.isIgnored) {
			classNames.push("ignored");
		}

		if (this.props.highlightRow) {
			classNames.push("highlight-row");
		}

		if (this.props.highlightColumn) {
			classNames.push("highlight-column");
		}

		return (
			<div
				className={classNames.join(" ")}
				style={{ color, backgroundColor, ...this.props.style }}
			>
				{label}
			</div>
		);
	}
}
