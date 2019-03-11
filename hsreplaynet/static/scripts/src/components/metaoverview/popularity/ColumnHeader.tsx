import React from "react";
import { ArchetypeRankData, SortDirection } from "../../../interfaces";
import SortIndicator from "../../SortIndicator";
import { image } from "../../../helpers";
import { WithTranslation, withTranslation } from "react-i18next";

interface Props extends WithTranslation {
	active: boolean;
	direction: SortDirection;
	rankData: ArchetypeRankData;
	sortKey: string;
	style?: any;
	onClick?: (key: string, direction: SortDirection) => void;
}

class ColumnHeader extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t } = this.props;

		const imageName =
			"Medal_Ranked_" + (this.props.rankData.rank || "Legend");
		return (
			<div
				className="matchup-column-header"
				style={this.props.style}
				onClick={event => {
					if (event && event.currentTarget) {
						event.currentTarget.blur();
					}
					this.props.onClick(
						this.props.sortKey,
						this.getNextDirection(),
					);
				}}
				onKeyPress={event => {
					if (event.which === 13) {
						this.props.onClick(
							this.props.sortKey,
							this.getNextDirection(),
						);
					}
				}}
			>
				<img
					className="rank-icon"
					src={image(`64x/ranked-medals/${imageName}.png`)}
				/>
				{this.props.rankData.rank
					? t("Rank {rank}", { rank: this.props.rankData.rank })
					: t("Legend")}
				<SortIndicator
					direction={this.props.active ? this.props.direction : null}
				/>
			</div>
		);
	}

	getNextDirection(): SortDirection {
		if (!this.props.active) {
			return "descending";
		}
		return this.props.direction === "ascending"
			? "descending"
			: "ascending";
	}
}

export default withTranslation()(ColumnHeader);
