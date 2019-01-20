import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import { RankRange } from "../../filters";
import { formatNumber } from "../../i18n";

interface Props extends InjectedTranslateProps {
	rankRange: keyof typeof RankRange;
}

class PrettyRankRange extends React.Component<Props> {
	private renderRank(rank: string): string {
		const { t } = this.props;

		switch (rank) {
			case "LEGEND":
				return t("Legend");
			case "ONE":
				return "1";
			case "FIVE":
				return "5";
			case "TEN":
				return "10";
			case "FIFTEEN":
				return "15";
			case "TWENTY":
				return "20";
			case "TWENTYFIVE":
				return "25";
		}

		return rank;
	}

	private renderRankRange(minRank: string, maxRank: string): string {
		const { t } = this.props;
		return t("{rankMin}–{rankMax}", {
			rankMin: minRank,
			rankMax: maxRank,
		});
	}

	public render(): React.ReactNode {
		const { rankRange, t } = this.props;

		const matches = /^([A-Z]+)_THROUGH_([A-Z]+)$/.exec(
			rankRange.toUpperCase(),
		);
		if (matches !== null) {
			const rankMin = this.renderRank(matches[1]);
			const rankMax = this.renderRank(matches[2]);
			return this.renderRankRange(rankMin, rankMax);
		}

		switch (rankRange) {
			case RankRange.TOP_1000_LEGEND:
				return t("Top {rank} (Legend)", { rank: formatNumber(1000) });
			case RankRange.LEGEND_ONLY:
				return t("Legend only");
			case RankRange.ALL:
				return this.renderRankRange(
					this.renderRank("LEGEND"),
					this.renderRank("TWENTYFIVE"),
				);
		}

		return rankRange;
	}
}

export default translate()(PrettyRankRange);
