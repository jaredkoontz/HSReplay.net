import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import DataInjector, { Query } from "../DataInjector";
import InfoIcon from "../InfoIcon";
import TurnPlayedBarChart from "../charts/TurnPlayedBarChart";
import WinrateByTurnLineChart from "../charts/WinrateByTurnLineChart";
import ChartLoading from "../loading/ChartLoading";

interface Props extends InjectedTranslateProps {
	query: Query | Query[];
}

class QuestCompletionDetail extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t } = this.props;
		return (
			<div className="container-fluid">
				<div className="row">
					<div className="col-lg-6 col-md-6">
						<div className="chart-wrapper">
							<DataInjector query={this.props.query}>
								<ChartLoading>
									<TurnPlayedBarChart
										opponentClass="ALL"
										widthRatio={2}
									/>
								</ChartLoading>
							</DataInjector>
							<InfoIcon
								header={t("Popularity by turn completed")}
								content={t(
									"Percentage of the time this Quest is completed on a given turn.",
								)}
							/>
						</div>
					</div>
					<div className="col-lg-6 col-md-6">
						<div className="chart-wrapper">
							<DataInjector query={this.props.query}>
								<ChartLoading>
									<WinrateByTurnLineChart
										opponentClass="ALL"
										widthRatio={2}
									/>
								</ChartLoading>
							</DataInjector>
							<InfoIcon
								header={t("Winrate by turn completed")}
								content={t(
									"Percentage of games won when this Quest is completed on a given turn.",
								)}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}
}
export default translate()(QuestCompletionDetail);
