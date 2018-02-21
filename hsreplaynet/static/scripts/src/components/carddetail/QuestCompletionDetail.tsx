import React from "react";
import InfoIcon from "../InfoIcon";
import DataInjector, { Query } from "../DataInjector";
import ChartLoading from "../loading/ChartLoading";
import WinrateByTurnLineChart from "../charts/WinrateByTurnLineChart";
import TurnPlayedBarChart from "../charts/TurnPlayedBarChart";

interface Props {
	query: Query | Query[];
}

export default class QuestCompletionDetail extends React.Component<Props> {
	public render(): React.ReactNode {
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
								header="Popularity by turn completed"
								content="Percentage of the time this Quest is completed on a given turn."
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
								header="Winrate by turn completed"
								content="Percentage of games won when this Quest is completed on a given turn."
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}
}
