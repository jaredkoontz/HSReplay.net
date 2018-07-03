import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import { image, toDynamicFixed, winrateData } from "../../helpers";

interface Props extends InjectedTranslateProps {
	href: string;
	popularity?: number;
	rank?: number;
	title: string;
	winrate?: number;
	type: "performance" | "popularity";
}

class RankBox extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t } = this.props;
		let content = null;
		if (
			this.props.rank !== undefined &&
			(this.props.popularity !== undefined ||
				this.props.winrate !== undefined)
		) {
			const wrData = winrateData(50, this.props.winrate, 3);
			const rankMedalName =
				"Medal_Ranked_" + (this.props.rank || "Legend");

			let data = null;
			if (this.props.type === "popularity") {
				data = (
					<span>
						{t("{n}% of decks", {
							n: toDynamicFixed(this.props.popularity, 2),
						})}
					</span>
				);
			} else {
				data = (
					<>
						<span className="winrate">{t("Winrate:")}</span>
						<span style={{ color: wrData.color }}>
							{toDynamicFixed(this.props.winrate, 2)}%
						</span>
					</>
				);
			}

			content = (
				<>
					<img
						className="rank-icon"
						src={image(`ranked-medals/${rankMedalName}.png`)}
					/>
					<h2>
						{this.props.rank
							? t("Rank {rank}", { rank: this.props.rank })
							: t("Legend")}
					</h2>
					<div className="box-data">{data}</div>
				</>
			);
		}

		return (
			<div className="col-xs-12 col-sm-6 col-md-4 col-lg-3">
				<a className="box rank-box" href={this.props.href}>
					<div className="box-title">{this.props.title}</div>
					<div className="box-content">{content}</div>
				</a>
			</div>
		);
	}
}

export default translate()(RankBox);
