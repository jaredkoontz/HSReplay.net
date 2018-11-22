import _ from "lodash";
import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import { Colors } from "../../../Colors";
import {
	getArchetypeUrl,
	getColorString,
	image,
	toDynamicFixed,
	winrateData,
} from "../../../helpers";
import { MatchupData } from "../../../interfaces";
import Tooltip from "../../Tooltip";
import { formatNumber } from "../../../i18n";

export type CellColorStyle = "background" | "text";

interface Props extends InjectedTranslateProps {
	highlightColumn?: boolean;
	highlightRow?: boolean;
	matchupData: MatchupData;
	isIgnored: boolean;
	style?: any;
	minGames?: number;
	ignoreMirror?: boolean;
	colorStyle?: CellColorStyle;
	hasVods?: boolean;
}

export function isEligibleMatchup(
	games: number,
	minGames: number = 30,
): boolean {
	return games >= minGames;
}

class MatchupCell extends React.Component<Props> {
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
		const { ignoreMirror, matchupData, minGames, t } = this.props;
		let label: string | JSX.Element = "";
		let color = "black";
		let backgroundColor = "white";
		let fontWeight = null;
		const winrate = matchupData.winrate || 0;
		let tendencyStr = null;
		const wData = winrateData(matchupData.globalWinrate || 50, winrate, 2);
		if (this.props.colorStyle === "text") {
			color = wData.color;
			tendencyStr = matchupData.globalWinrate ? wData.tendencyStr : null;
		}
		const classNames = ["matchup-cell"];

		if (
			!ignoreMirror &&
			matchupData.friendlyId === matchupData.opponentId
		) {
			// mirror match
			label = (
				<Tooltip
					id="tooltip-matchup-cell"
					content={
						<>
							<div
								className={
									"tooltip-header player-class " +
									matchupData.friendlyPlayerClass.toLowerCase()
								}
							>
								{matchupData.friendlyName}
							</div>
							{t("Mirror matchup")}
							{this.props.hasVods ? (
								<div className="twitch-vods-available">
									<img src={image("socialauth/twitch.png")} />
									{t("Twitch VODs available!")}
								</div>
							) : null}
						</>
					}
					simple
				>
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
		} else if (isEligibleMatchup(matchupData.totalGames, minGames || 30)) {
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
									<th>{t("Versus:")}</th>
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
									<th>{t("Winrate:")}</th>
									<td>{toDynamicFixed(winrate, 2)}%</td>
								</tr>
								<tr>
									<th>{t("Games:")}</th>
									<td>
										{formatNumber(
											matchupData.totalGames || 0,
										)}
									</td>
								</tr>
							</table>
							{this.props.hasVods ? (
								<div className="twitch-vods-available">
									<img src={image("socialauth/twitch.png")} />
									{t("Twitch VODs available!")}
								</div>
							) : null}
						</div>
					}
				>
					{matchupData.globalWinrate !== undefined ? (
						<>
							<p>
								{tendencyStr}
								{formatNumber(winrate, 2)}%
							</p>
							<p>
								Avg.{" "}
								{formatNumber(matchupData.globalWinrate, 2)}%
							</p>
						</>
					) : (
						<>
							{formatNumber(winrate, 2) + "%"}
							{this.props.hasVods ? (
								<div className="vod-indicator" />
							) : null}
						</>
					)}
				</Tooltip>
			);
		} else {
			// not enough data
			label = (
				<Tooltip
					content={
						matchupData.totalGames === 0
							? t("No games")
							: t("Not enough games")
					}
					simple
				>
					⁓
				</Tooltip>
			);
			backgroundColor = "rgb(200,200,200)";
			color = "black";
			fontWeight = "normal";
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
		if (this.props.colorStyle === "text") {
			backgroundColor = "transparent";
		}

		if (this.props.hasVods) {
			classNames.push("vods-available");
			return (
				<a
					className={classNames.join(" ")}
					style={{
						color,
						backgroundColor,
						fontWeight,
						...this.props.style,
					}}
					href={`${getArchetypeUrl(
						matchupData.friendlyId,
						matchupData.friendlyName,
					)}#tab=vods&vodsOpponent=a${matchupData.opponentId}`}
				>
					{label}
				</a>
			);
		}

		return (
			<div
				className={classNames.join(" ")}
				style={{
					color,
					backgroundColor,
					fontWeight,
					...this.props.style,
				}}
			>
				{label}
			</div>
		);
	}
}
export default translate()(MatchupCell);
