import React from "react";
import ProfileChart, { Aggregation } from "./ProfileChart";
import { WithTranslation, withTranslation } from "react-i18next";

interface Props extends WithTranslation {
	caption?: string;
	averageWinrate: number;
	aggregate?: Aggregation;
	data: any;
}

class WinrateChart extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t } = this.props;

		const data = [];
		let firstYear: null | number = null;
		switch (this.props.aggregate) {
			case Aggregation.BY_SEASON:
				const winrateBySeason = this.props.data.winrateBySeason;
				for (const [
					index,
					{ year, season, winrate },
				] of winrateBySeason.entries()) {
					if (firstYear === null) {
						firstYear = year;
					}
					const yearsApart = year - firstYear;
					if (index > 0) {
						// check for a gap in the data, and mark it so the chart shows a gap
						const {
							year: lastYear,
							season: lastSeason,
						} = winrateBySeason[index - 1];
						for (let i = lastYear; i <= year; i++) {
							const yearDifference = i - firstYear;
							for (
								let j = i === lastYear ? lastSeason + 1 : 1;
								i === year ? j < season : j < 12;
								j++
							) {
								data.push({
									x: yearDifference * 12 + (j - 1),
									y: null,
								});
							}
						}
					}
					data.push({
						x: yearsApart * 12 + (season - 1),
						y: winrate * 100,
					});
				}
				break;
			case Aggregation.BY_DAY:
				const winrateByDay = this.props.data.winrateByDay;
				for (const [
					index,
					{ year, day, winrate },
				] of winrateByDay.entries()) {
					if (firstYear === null) {
						firstYear = year;
					}
					const yearsApart = year - firstYear;
					if (index > 0) {
						// check for a gap in the data, and mark it so the chart shows a gap
						const { year: lastYear, day: lastDay } = winrateByDay[
							index - 1
						];
						for (let i = lastYear; i <= year; i++) {
							const yearDifference = i - firstYear;
							for (
								let j = i === lastYear ? lastDay + 1 : 1;
								i === year ? j < day : j < 365;
								j++
							) {
								data.push({
									x: yearDifference * 12 + j,
									y: null,
								});
							}
						}
					}
					data.push({
						x: yearsApart * 12 + day,
						y: winrate * 100,
					});
				}
				break;
		}

		return (
			<ProfileChart
				data={[
					{
						id: "Winrate",
						data,
					},
				]}
				summaryLabel={t("Average Winrate")}
				summaryValue={this.props.averageWinrate * 100}
				caption={this.props.caption}
				aggregate={this.props.aggregate}
				firstYear={typeof firstYear !== null ? firstYear : undefined}
			/>
		);
	}
}

export default withTranslation()(WinrateChart);
